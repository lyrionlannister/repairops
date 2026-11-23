import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { RepairNoteDevice } from "../entities/repair-note-device.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class RepairNoteDeviceDao extends TenantScopedDao<RepairNoteDevice> {
  constructor(@inject(repositoryToken(RepairNoteDevice)) repository: Repository<RepairNoteDevice>) {
    super(repository);
  }

  async findByRepairNoteIds(repairNoteIds: string[]): Promise<RepairNoteDevice[]> {
    if (repairNoteIds.length === 0) return [];
    return this.scoped()
      .andWhere("entity.repairNoteId IN (:...repairNoteIds)", { repairNoteIds })
      .orderBy("entity.repairNoteId", "ASC")
      .addOrderBy("entity.position", "ASC")
      .getMany();
  }
}
