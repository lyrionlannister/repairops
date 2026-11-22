import { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../identity/auth/middlewares/auth.middleware.js";
import type { UserRole } from "../../identity/auth/entities/user.entity.js";
import { effectivePermissions } from "../../identity/authz/permissions.js";
import { runWithTenant, type BranchScope } from "./tenant-context.js";
import AppDataSource from "../config/data-source.js";
import { container } from "tsyringe";
import { PresenceService } from "../../identity/auth/services/presence.service.js";

// El JWT dura 24 h: si roles, flag de plataforma o estado activo se tomaran del token,
// desactivar o cambiar los roles de alguien no surtiría efecto hasta que expirara.
async function loadAccess(
  tenantId: string,
  userId: string,
): Promise<{ roles: UserRole[]; isPlatformAdmin: boolean } | null> {
  const rows: Array<{ roles: UserRole[]; isPlatformAdmin: boolean }> = await AppDataSource.query(
    `SELECT u.es_platform_admin AS "isPlatformAdmin",
            COALESCE(array_agg(ur.role::text) FILTER (WHERE ur.role IS NOT NULL), '{}') AS "roles"
     FROM usuarios u
     LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.tenant_id = u.tenant_id
     WHERE u.id = $1 AND u.tenant_id = $2 AND u.activo = true
     GROUP BY u.id`,
    [userId, tenantId],
  );
  return rows[0] ?? null;
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

// Va siempre despues de authMiddleware: ese ya puso req.user.tenantId desde
// el JWT. Este middleware propaga ese tenant, sus permisos (y, si el usuario no es owner, su alcance
// de sucursales) al AsyncLocalStorage para que los TenantScopedDao de todo el resto de
// la cadena lo vean. El owner accede a todas las sucursales y no lleva alcance.
export const tenantMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const user = req.user;
  const tenantId = user?.tenantId;

  if (!user || !tenantId) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  try {
    const access = await loadAccess(tenantId, user.id);
    if (!access) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const permissions = effectivePermissions(access.roles, access.isPlatformAdmin);
    user.roles = access.roles;
    user.isPlatformAdmin = access.isPlatformAdmin;
    user.permissions = permissions;
    const branch = access.roles.includes("owner") ? null : await loadBranchScope(tenantId, user.id);
    runWithTenant(
      tenantId,
      () => {
        container
          .resolve(PresenceService)
          .touch(user.id)
          .catch(() => {});
        next();
      },
      branch, { userId: user.id, roles: access.roles, permissions });
  } catch (error) {
    next(error);
  }
};
