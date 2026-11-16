import { singleton, inject } from "tsyringe";
import { LocalDao } from "../daos/local.dao.js";
import { Local } from "../entities/local.entity.js";
import { rasterizeLogoIfSvg } from "../../../core/common/utils/rasterize-logo.js";

@singleton()
export class LocalService {
  constructor(private localDao: LocalDao) {}

  async getConfig(): Promise<Local> {
    return this.localDao.findOrCreate();
  }

  async updateConfig(data: Partial<Local>): Promise<Local> {
    const local = await this.localDao.findOrCreate();
    const payload = data.logo ? { ...data, logo: await rasterizeLogoIfSvg(data.logo) } : data;
    return (await this.localDao.update(local.id, payload)) as Local;
  }

  async consumeControlNumber(): Promise<number> {
    return this.localDao.consumeControlNumber();
  }

  async consumeSaleNumber(): Promise<number> {
    return this.localDao.consumeSaleNumber();
  }

  async consumeReturnNumber(): Promise<number> {
    return this.localDao.consumeReturnNumber();
  }
}
