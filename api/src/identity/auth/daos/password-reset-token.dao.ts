import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { PasswordResetToken } from "../entities/password-reset-token.entity.js";
import { BaseDao } from "../../../core/daos/base.dao.js";

@singleton()
export class PasswordResetTokenDao extends BaseDao<PasswordResetToken> {
  constructor(
    @inject(repositoryToken(PasswordResetToken)) repository: Repository<PasswordResetToken>,
  ) {
    super(repository);
  }

  // UPDATE atómico: el mismo enlace nunca restablece la contraseña dos veces.
  async consume(tokenHash: string): Promise<PasswordResetToken | null> {
    const result = await this.repository
      .createQueryBuilder()
      .update(PasswordResetToken)
      .set({ consumedAt: () => "CURRENT_TIMESTAMP" })
      .where("token_hash = :tokenHash AND consumed_at IS NULL AND expires_at > CURRENT_TIMESTAMP", {
        tokenHash,
      })
      .returning(["id", "tenantId", "userId"])
      .execute();
    const row = (result.raw as Array<{ id: string; tenant_id: string; user_id: string }>)[0];
    if (!row) return null;
    return this.repository.create({ id: row.id, tenantId: row.tenant_id, userId: row.user_id });
  }

  async invalidatePendingForUser(userId: string, tenantId: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(PasswordResetToken)
      .set({ consumedAt: () => "CURRENT_TIMESTAMP" })
      .where("user_id = :userId AND tenant_id = :tenantId AND consumed_at IS NULL", {
        userId,
        tenantId,
      })
      .execute();
  }
}
