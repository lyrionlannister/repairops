import { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../identity/auth/middlewares/auth.middleware.js";
import type { UserRole } from "../../identity/auth/entities/user.entity.js";
import { effectivePermissions } from "../../identity/authz/permissions.js";
import { runWithTenant, type BranchScope } from "./tenant-context.js";
import AppDataSource from "../config/data-source.js";
import { container } from "tsyringe";
import { PresenceService } from "../../identity/auth/services/presence.service.js";
import { publicIdResponses } from "../http/public-id/public-id-response.js";
import {
  PublicIdNotFoundError,
  resolveRequestPublicIds,
} from "../http/public-id/public-id-request.js";
import { UUID } from "../http/public-id/public-id-metadata.js";

// El JWT dura 15 min: si roles, flag de plataforma o estado activo se tomaran del token,
// desactivar o cambiar los roles de alguien no surtiría efecto hasta que expirara.
export interface Access {
  id: string;
  tenantId: string;
  roles: UserRole[];
  isPlatformAdmin: boolean;
  subscriptionStatus: string | null;
  emailVerified: boolean;
}

// El JWT solo trae public_ids (usuario y tenant): aqui se resuelven a los ids internos,
// y el usuario tiene que pertenecer a ese tenant. Tambien la usa ChatRealtimeService
// para autenticar el handshake del socket con el mismo criterio que el HTTP normal.
export async function loadAccess(
  tenantPublicId: string,
  userPublicId: string,
): Promise<Access | null> {
  if (!UUID.test(userPublicId) || !UUID.test(tenantPublicId)) return null;
  const rows: Access[] = await AppDataSource.query(
    `SELECT u.id::text AS "id", u.tenant_id::text AS "tenantId", u.es_platform_admin AS "isPlatformAdmin",
            s.status AS "subscriptionStatus",
            (u.email_verificado_en IS NOT NULL) AS "emailVerified",
            COALESCE(array_agg(ur.role::text) FILTER (WHERE ur.role IS NOT NULL), '{}') AS "roles"
     FROM usuarios u
     JOIN tenants t ON t.id = u.tenant_id
     LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.tenant_id = u.tenant_id
     LEFT JOIN subscriptions s ON s.tenant_id = t.id
     WHERE u.public_id = $1 AND t.public_id = $2 AND u.activo = true
     GROUP BY u.id, s.status, u.email_verificado_en`,
    [userPublicId, tenantPublicId],
  );
  return rows[0] ?? null;
}

// Un taller con pago rechazado o cancelado sigue autenticado (necesita serlo
// para arreglar su pago), pero nada de la app salvo su propia sesión y la
// pantalla de planes -- /billing/select-plan genera un Checkout nuevo
// (BillingService.selectPlan) sin importar el estado actual de la suscripción.
const BLOCKING_STATUSES = new Set(["past_due", "canceled"]);
const SUBSCRIPTION_RECOVERY_BASE_URLS = new Set(["/api/v1/auth", "/api/v1/billing"]);

// A diferencia del bloqueo de suscripción, acá /billing NO es ruta de
// recuperación: el plan se elige después de verificar correo, no antes
// (ver AuthService.register / issueEmailVerification).
const EMAIL_VERIFICATION_RECOVERY_BASE_URLS = new Set(["/api/v1/auth"]);

export function isEmailVerificationBlocked(emailVerified: boolean, baseUrl: string): boolean {
  return !emailVerified && !EMAIL_VERIFICATION_RECOVERY_BASE_URLS.has(baseUrl);
}

// Exportadas sueltas (no un objeto) para probarlas sin levantar Express/DI --
// la decisión en sí es pura, lo único que necesita el middleware real es Access.
export function isSubscriptionBlocked(status: string | null, baseUrl: string): boolean {
  return (
    status !== null &&
    BLOCKING_STATUSES.has(status) &&
    !SUBSCRIPTION_RECOVERY_BASE_URLS.has(baseUrl)
  );
}

export function subscriptionBlockedMessage(status: string): string {
  return status === "canceled"
    ? "Tu suscripción fue cancelada. Elige un plan para seguir usando RepairOps."
    : "Tu pago no se pudo procesar. Actualiza tu método de pago para seguir usando RepairOps.";
}

// Sucursales del personal (no owner): se leen de la base en cada petición porque las
// asignaciones cambian en caliente y el JWT no las lleva. Solo cuentan las activas.
async function loadBranchScope(tenantId: string, userId: string): Promise<BranchScope> {
  const rows: Array<{ branchId: string; isPrimary: boolean }> = await AppDataSource.query(
    `SELECT ub.branch_id::text AS "branchId", ub.is_primary AS "isPrimary"
     FROM user_branches ub JOIN branches b ON b.id = ub.branch_id AND b.tenant_id = ub.tenant_id
     WHERE ub.tenant_id = $1 AND ub.user_id = $2 AND b.activa = true`,
    [tenantId, userId],
  );
  const primaryId = rows.find((row) => row.isPrimary)?.branchId ?? null;
  return {
    readIds: primaryId ? [primaryId] : [],
    writeIds: rows.map((row) => row.branchId),
    primaryId,
  };
}

// Va siempre despues de authMiddleware: ese ya puso los public_ids de usuario y tenant
// desde el JWT. Este middleware propaga ese tenant, sus permisos (y, si el usuario no es owner, su alcance
// de sucursales) al AsyncLocalStorage para que los TenantScopedDao de todo el resto de
// la cadena lo vean. El owner accede a todas las sucursales y no lleva alcance.
export const tenantMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const user = req.user;

  if (!user?.tenantPublicId) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  try {
    const access = await loadAccess(user.tenantPublicId, user.publicId);
    if (!access) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    if (isEmailVerificationBlocked(access.emailVerified, req.baseUrl)) {
      res.status(403).json({
        error: "Verifica tu correo para continuar.",
        code: "email_unverified",
      });
      return;
    }
    if (isSubscriptionBlocked(access.subscriptionStatus, req.baseUrl)) {
      res.status(402).json({
        error: subscriptionBlockedMessage(access.subscriptionStatus!),
        code: "subscription_blocked",
        status: access.subscriptionStatus,
      });
      return;
    }
    const permissions = effectivePermissions(access.roles, access.isPlatformAdmin);
    user.id = access.id;
    user.tenantId = access.tenantId;
    const tenantId = access.tenantId;
    user.roles = access.roles;
    user.isPlatformAdmin = access.isPlatformAdmin;
    user.permissions = permissions;
    const branch = access.roles.includes("owner") ? null : await loadBranchScope(tenantId, user.id);
    await runWithTenant(
      tenantId,
      async () => {
        container
          .resolve(PresenceService)
          .touch(user.id)
          .catch(() => {});
        try {
          await resolveRequestPublicIds(req);
        } catch (error) {
          if (!(error instanceof PublicIdNotFoundError)) throw error;
          res.status(404).json({ error: error.message });
          return;
        }
        publicIdResponses(req, res, next);
      },
      branch,
      { userId: user.id, roles: access.roles, permissions },
    );
  } catch (error) {
    next(error);
  }
};
