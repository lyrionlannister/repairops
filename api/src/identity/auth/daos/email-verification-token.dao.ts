import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { EmailVerificationToken } from "../entities/email-verification-token.entity.js";
import { BaseDao } from "../../../core/daos/base.dao.js";

@singleton()
export class EmailVerificationTokenDao extends BaseDao<EmailVerificationToken> {
  constructor(
    @inject(repositoryToken(EmailVerificationToken)) repository: Repository<EmailVerificationToken>,
  ) {
    super(repository);
  }

  async findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null> {
    return this.repository.findOneBy({ tokenHash });
  }

  // Igual que TenantInvitationDao.consume: el UPDATE atómico es lo que impide
  // que el mismo enlace se use dos veces a la vez.
  async consume(tokenHash: string): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .update(EmailVerificationToken)
      .set({ consumedAt: () => "CURRENT_TIMESTAMP" })
      .where("token_hash = :tokenHash AND consumed_at IS NULL AND expires_at > CURRENT_TIMESTAMP", {
        tokenHash,
      })
      .execute();
    return (result.affected ?? 0) > 0;
  }

  // Antes de reenviar un correo de verificación nuevo, invalida los enlaces
  // pendientes anteriores -- si el usuario tiene varios correos en la bandeja,
  // solo el último sirve.
  async invalidatePendingForUser(userId: string, tenantId: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(EmailVerificationToken)
      .set({ consumedAt: () => "CURRENT_TIMESTAMP" })
      .where("user_id = :userId AND tenant_id = :tenantId AND consumed_at IS NULL", {
        userId,
        tenantId,
      })
      .execute();
  }
}
