import { singleton } from "tsyringe";
import { AuditLogDao } from "../daos/audit-log.dao.js";
import { getCurrentTenantId, getRequestActor } from "../../tenancy/tenant-context.js";

// Acciones registradas. La lista crece con cada módulo que audita; el
// formato es `<modulo>.<evento>` para poder filtrar por prefijo.
export const AUDIT_ACTIONS = {
  AUTH_LOGIN_FAILED: "auth.login_failed",
  AUTH_LOGIN: "auth.login",
  AUTH_ROLE_CHANGED: "auth.role_changed",
  AUTH_USER_CREATED: "auth.user_created",
  AUTH_USER_STATUS_CHANGED: "auth.user_status_changed",
  AUTH_EMAIL_VERIFIED: "auth.email_verified",
  AUTH_EMAIL_VERIFICATION_RESENT: "auth.email_verification_resent",
  AUTH_PASSWORD_RESET_REQUESTED: "auth.password_reset_requested",
  AUTH_PASSWORD_RESET: "auth.password_reset",
  CASH_SESSION_OPENED: "cash.session_opened",
  CASH_SESSION_CLOSED: "cash.session_closed",
  CASH_VARIANCE_AUTHORIZED: "cash.variance_authorized",
  SALES_CREATED: "sales.created",
  SALES_PRICE_SET: "sales.price_set",
  SALES_UPDATED: "sales.updated",
} as const;

export interface AuditRecordInput {
  tenantId?: string | null;
  userId?: string | null;
  actorEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
}

// Escritura best-effort: si la bitácora falla, la operación que la originó
// no debe fallar por eso -- el error queda solo en el log del servidor.
@singleton()
export class AuditLogService {
  constructor(private auditLogDao: AuditLogDao) {}

  async record(input: AuditRecordInput): Promise<void> {
    try {
      await this.auditLogDao.create({
        tenantId: input.tenantId ?? null,
        userId: input.userId ?? null,
        actorEmail: input.actorEmail ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        details: input.details ?? null,
      });
    } catch (error) {
      console.error("[audit] No se pudo registrar el evento:", error);
    }
  }

  // Misma escritura, con tenant y actor tomados del contexto de la petición
  // (tenantMiddleware). Fuera de una petición (tests, jobs) no hay contexto:
  // el evento queda sin actor en vez de romper la operación.
  async recordForCurrentActor(input: Omit<AuditRecordInput, "tenantId" | "userId">): Promise<void> {
    await this.record({
      ...input,
      tenantId: currentTenantIdOrNull(),
      userId: getRequestActor()?.userId ?? null,
    });
  }
}

const currentTenantIdOrNull = (): string | null => {
  try {
    return getCurrentTenantId();
  } catch {
    return null;
  }
};
