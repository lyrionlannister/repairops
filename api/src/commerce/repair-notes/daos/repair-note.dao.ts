import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { RepairNote } from "../entities/repair-note.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class RepairNoteDao extends TenantScopedDao<RepairNote> {
  constructor(@inject(repositoryToken(RepairNote)) repository: Repository<RepairNote>) {
    super(repository);
  }

  async findAllOrdered(branchId?: string | null): Promise<RepairNote[]> {
    return this.scoped()
      .andWhere(branchId ? "entity.localId = :branchId" : "1 = 1", { branchId })
      .orderBy("entity.controlNumber", "DESC").getMany();
  }

  async findByControlNumber(controlNumber: number): Promise<RepairNote | null> {
    return this.scoped().andWhere("entity.controlNumber = :controlNumber", { controlNumber }).getOne();
  }

  async findByCustomerId(customerId: string): Promise<RepairNote[]> {
    return this.scoped()
      .andWhere("entity.customerId = :customerId", { customerId })
      .orderBy("entity.receivedAt", "DESC")
      .getMany();
  }
}
