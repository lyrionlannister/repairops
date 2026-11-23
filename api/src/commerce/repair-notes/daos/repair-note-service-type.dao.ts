import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { RepairNoteServiceType } from "../entities/repair-note-service-type.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class RepairNoteServiceTypeDao extends TenantScopedDao<RepairNoteServiceType> {
  constructor(@inject(repositoryToken(RepairNoteServiceType)) repository: Repository<RepairNoteServiceType>) {
    super(repository);
  }

  async findByRepairNoteId(repairNoteId: string): Promise<RepairNoteServiceType[]> {
    return this.scoped().andWhere("entity.repairNoteId = :repairNoteId", { repairNoteId }).getMany();
  }

  async findByRepairNoteIds(repairNoteIds: string[]): Promise<RepairNoteServiceType[]> {
    if (repairNoteIds.length === 0) return [];
    return this.scoped()
      .andWhere("entity.repairNoteId IN (:...repairNoteIds)", { repairNoteIds })
      .orderBy("entity.id", "ASC")
      .getMany();
  }
}
