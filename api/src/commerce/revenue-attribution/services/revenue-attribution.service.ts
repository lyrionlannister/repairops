import { singleton, inject } from "tsyringe";
import { RevenueAttributionSettingDao } from "../daos/revenue-attribution-setting.dao.js";
import { AttributionBasis, RevenueAttributionSetting } from "../entities/revenue-attribution-setting.entity.js";

@singleton()
export class RevenueAttributionService {
  constructor(private dao: RevenueAttributionSettingDao) {}

  async getSetting(): Promise<RevenueAttributionSetting> {
    return this.dao.findOrCreate();
  }

  async setBasis(basis: AttributionBasis): Promise<RevenueAttributionSetting> {
    const setting = await this.dao.findOrCreate();
    return (await this.dao.update(setting.id, { attributionBasis: basis })) as RevenueAttributionSetting;
  }
}
