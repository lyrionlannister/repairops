import { singleton } from "tsyringe";
import { createHash, randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { UserDao } from "../daos/user.dao.js";
import { RefreshTokenDao } from "../daos/refresh-token.dao.js";
import { PasswordResetTokenDao } from "../daos/password-reset-token.dao.js";
import { sendPasswordResetEmail } from "../clients/resend.client.js";
import { AuditLogService, AUDIT_ACTIONS } from "../../../core/audit/services/audit-log.service.js";
import { BusinessError } from "../../../core/http/business-error.js";
import { optionalEnv } from "../../../core/config/env.js";
import { allowSystemScope, runWithTenant } from "../../../core/tenancy/tenant-context.js";
import { PASSWORD_RESET_TOKEN_MAX_AGE_MS } from "../constants/auth.constants.js";

const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

@singleton()
export class PasswordResetService {
  constructor(
    private userDao: UserDao,
    private refreshTokenDao: RefreshTokenDao,
    private passwordResetTokenDao: PasswordResetTokenDao,
    private auditLogService: AuditLogService,
  ) {}

  // Nunca dice si el correo existe: quien llama responde lo mismo en ambos casos.
  async requestReset(email: string): Promise<void> {
    const user = await allowSystemScope(() =>
      this.userDao.findByEmailAcrossTenants(email.trim()),
    );
    if (!user || !user.isActive) return;

    const token = randomBytes(32).toString("hex");
    await this.passwordResetTokenDao.invalidatePendingForUser(user.id, user.tenantId);
    await this.passwordResetTokenDao.create({
      tenantId: user.tenantId,
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_MAX_AGE_MS),
      consumedAt: null,
    });
    const resetUrl = `${optionalEnv("CLIENT_URL", "http://localhost:5173")}/identity/reset-password?token=${token}`;
    await sendPasswordResetEmail({ to: user.email, firstName: user.firstName, resetUrl });
    await this.auditLogService.record({
      tenantId: user.tenantId,
      userId: user.id,
      actorEmail: user.email,
      action: AUDIT_ACTIONS.AUTH_PASSWORD_RESET_REQUESTED,
      entity: "user",
      entityId: user.publicId,
    });
  }

  // Cambiar la contraseña cierra todas las sesiones abiertas: si alguien más
  // la conocía, queda fuera.
  async resetPassword(token: string, password: string): Promise<void> {
    const row = await this.passwordResetTokenDao.consume(hashToken(token));
    if (!row) {
      throw new BusinessError("El enlace no es válido o ya venció. Pide uno nuevo.");
    }
    await runWithTenant(row.tenantId, async () => {
      const updated = await this.userDao.update(row.userId, { password: await hash(password, 10) });
      if (!updated) throw new BusinessError("El enlace no es válido o ya venció. Pide uno nuevo.");
      await this.refreshTokenDao.revokeAllForUser(row.userId, row.tenantId);
      await this.auditLogService.record({
        tenantId: row.tenantId,
        userId: row.userId,
        actorEmail: updated.email,
        action: AUDIT_ACTIONS.AUTH_PASSWORD_RESET,
        entity: "user",
        entityId: updated.publicId,
      });
    });
  }
}
