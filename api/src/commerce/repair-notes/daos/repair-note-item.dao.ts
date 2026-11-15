import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { RepairNoteItem } from "../entities/repair-note-item.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class RepairNoteItemDao extends TenantScopedDao<RepairNoteItem> {
  constructor(@inject(repositoryToken(RepairNoteItem)) repository: Repository<RepairNoteItem>) {
    super(repository);
  }

  async findByRepairNoteId(repairNoteId: string): Promise<RepairNoteItem[]> {
    return this.scoped().andWhere("entity.repairNoteId = :repairNoteId", { repairNoteId }).getMany();
  }
}
