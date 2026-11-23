import { IsNull, Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { TenantInvitation } from "../entities/tenant-invitation.entity.js";
import { BaseDao } from "../../../core/daos/base.dao.js";

@singleton()
export class TenantInvitationDao extends BaseDao<TenantInvitation> {
  constructor(@inject(repositoryToken(TenantInvitation)) repository: Repository<TenantInvitation>) {
    super(repository);
  }

  async findByTokenHash(tokenHash: string): Promise<TenantInvitation | null> {
    return this.repository.findOneBy({ tokenHash });
  }

  // Marca la invitación como usada solo si sigue vigente y sin usar: el
  // UPDATE atómico es lo que impide que dos registros concurrentes usen el
  // mismo token (devuelve false si otro ya la consumió).
  async consume(tokenHash: string): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .update(TenantInvitation)
      .set({ usedAt: () => "CURRENT_TIMESTAMP" })
      .where("token_hash = :tokenHash AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP", {
        tokenHash,
      })
      .execute();
    return (result.affected ?? 0) > 0;
  }

  async listPending(): Promise<TenantInvitation[]> {
    return this.repository.find({
      where: { usedAt: IsNull() },
      order: { createdAt: "DESC" },
    });
  }
}
