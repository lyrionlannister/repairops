import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";
import { UserBranch } from "../entities/user-branch.entity.js";

@singleton()
export class UserBranchDao extends TenantScopedDao<UserBranch> {
  constructor(@inject(repositoryToken(UserBranch)) repository: Repository<UserBranch>) {
    super(repository);
  }

  async findAllOfTenant(): Promise<UserBranch[]> {
    return this.scoped().getMany();
  }

  // Reemplaza las sucursales de un usuario de forma atómica: nunca queda sin principal a medias.
  async replaceForUser(userId: string, branchIds: string[], primaryBranchId: string | null): Promise<void> {
    const tenantId = this.currentTenantId();
    await this.repository.manager.transaction(async (manager) => {
      await manager.delete(UserBranch, { tenantId, userId });
      for (const branchId of branchIds) {
        await manager.insert(UserBranch, { tenantId, userId, branchId, isPrimary: branchId === primaryBranchId });
      }
    });
  }
}
