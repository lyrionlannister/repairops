import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { RefreshToken } from "../entities/refresh-token.entity.js";
import { BaseDao } from "../../../core/daos/base.dao.js";

@singleton()
export class RefreshTokenDao extends BaseDao<RefreshToken> {
  constructor(@inject(repositoryToken(RefreshToken)) repository: Repository<RefreshToken>) {
    super(repository);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.repository.findOneBy({ tokenHash });
  }

  async revokeAllForUser(userId: string, tenantId: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: () => "CURRENT_TIMESTAMP" })
      .where("user_id = :userId AND tenant_id = :tenantId AND revoked_at IS NULL", {
        userId,
        tenantId,
      })
      .execute();
  }
}
