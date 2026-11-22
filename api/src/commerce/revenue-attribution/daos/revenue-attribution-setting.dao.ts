import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { RevenueAttributionSetting } from "../entities/revenue-attribution-setting.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class RevenueAttributionSettingDao extends TenantScopedDao<RevenueAttributionSetting> {
  constructor(@inject(repositoryToken(RevenueAttributionSetting)) repository: Repository<RevenueAttributionSetting>) {
    super(repository);
  }

  async findOrCreate(): Promise<RevenueAttributionSetting> {
    const tenantId = this.currentTenantId();
    const existing = await this.repository.findOneBy(
      { tenantId },
    );
    if (existing) return existing;

    const created = this.repository.create({ tenantId, attributionBasis: "total_value" } as Partial<RevenueAttributionSetting>);
    return this.repository.save(created);
  }
}
