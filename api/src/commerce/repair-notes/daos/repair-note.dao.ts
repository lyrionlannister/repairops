import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { RepairNote } from "../entities/repair-note.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";
import { can, currentUserId } from "../../../identity/authz/access.js";

// Quien solo tiene repair-notes.read.own (el técnico) ve únicamente las notas asignadas a
// él: listas filtradas y una nota ajena pedida por id responde como si no existiera.
// Sin actor (jobs, webhooks) no se filtra, igual que antes.
export function ownNotesOnly(): string | null {
  return !can("repair-notes.read") && can("repair-notes.read.own") ? currentUserId() : null;
}

@singleton()
export class RepairNoteDao extends TenantScopedDao<RepairNote> {
  constructor(@inject(repositoryToken(RepairNote)) repository: Repository<RepairNote>) {
    super(repository);
  }

  protected override scoped(alias = "entity") {
    const query = super.scoped(alias);
    const ownerId = ownNotesOnly();
    if (ownerId) query.andWhere(`${alias}.assignedEmployeeId = :ownNotesUserId`, { ownNotesUserId: ownerId });
    return query;
  }

  override async findById(id: string | number): Promise<RepairNote | null> {
    const note = await super.findById(id);
    const ownerId = ownNotesOnly();
    return note && ownerId && String(note.assignedEmployeeId) !== ownerId ? null : note;
  }

  override async findOne(where: Partial<RepairNote>): Promise<RepairNote | null> {
    const note = await super.findOne(where);
    const ownerId = ownNotesOnly();
    return note && ownerId && String(note.assignedEmployeeId) !== ownerId ? null : note;
  }

  override async findAll(): Promise<RepairNote[]> {
    return this.scoped().getMany();
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
