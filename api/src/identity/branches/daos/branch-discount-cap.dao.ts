import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";
import { BranchDiscountCap } from "../entities/branch-discount-cap.entity.js";
import type { UserRole } from "../../auth/entities/user.entity.js";

@singleton()
export class BranchDiscountCapDao extends TenantScopedDao<BranchDiscountCap> {
  constructor(
    @inject(repositoryToken(BranchDiscountCap)) repository: Repository<BranchDiscountCap>,
  ) {
    super(repository);
  }

  async findForBranch(branchId: string): Promise<BranchDiscountCap[]> {
    return this.scoped("cap")
      .andWhere("cap.branchId = :branchId", { branchId })
      .orderBy("cap.role", "ASC")
      .getMany();
  }

  async findForBranchAndRoles(
    branchId: string,
    roles: readonly UserRole[],
  ): Promise<BranchDiscountCap[]> {
    if (roles.length === 0) return [];
    return this.scoped("cap")
      .andWhere("cap.branchId = :branchId", { branchId })
      .andWhere("cap.role IN (:...roles)", { roles })
      .getMany();
  }

  async replaceForBranch(
    branchId: string,
    caps: ReadonlyArray<{ role: UserRole; maxDiscountPercent: string }>,
  ): Promise<void> {
    const tenantId = this.currentTenantId();
    await this.repository.manager.transaction(async (manager) => {
      await manager.delete(BranchDiscountCap, { tenantId, branchId });
      for (const cap of caps) {
        await manager.insert(BranchDiscountCap, { tenantId, branchId, ...cap });
      }
    });
  }
}
