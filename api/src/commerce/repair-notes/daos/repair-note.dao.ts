import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { RepairNote } from "../entities/repair-note.entity.js";
import type { RepairNoteFilters, RepairNoteStats } from "../types/repair-note-page.types.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";
import { containsPattern } from "../../../core/database/like-pattern.js";
import type { Page, PageRequest } from "../../../core/common/types/page.types.js";
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
    if (ownerId)
      query.andWhere(`${alias}.assignedEmployeeId = :ownNotesUserId`, { ownNotesUserId: ownerId });
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
      .orderBy("entity.controlNumber", "DESC")
      .getMany();
  }

  async findPage(filters: RepairNoteFilters, request: PageRequest): Promise<Page<RepairNote>> {
    const builder = this.filtered(filters);
    if (filters.status === "open") {
      builder.andWhere("entity.status NOT IN ('delivered', 'cancelled')");
    } else if (filters.status) {
      builder.andWhere("entity.status = :status", { status: filters.status });
    }
    if (filters.search) {
      builder.andWhere(
        `(entity.customerName ILIKE :like OR CAST(entity.controlNumber AS text) LIKE :like
          OR EXISTS (SELECT 1 FROM repair_note_devices d
            WHERE d.id_nota_reparacion = entity.id AND d.tenant_id = entity.tenant_id
              AND (d.marca || ' ' || d.modelo) ILIKE :like))`,
        { like: containsPattern(filters.search) },
      );
    }
    return this.paginate(builder.orderBy("entity.controlNumber", "DESC"), request);
  }

  async countStats(filters: RepairNoteFilters): Promise<RepairNoteStats> {
    const row = await this.filtered(filters)
      .select("COUNT(*)::int", "total")
      .addSelect("COUNT(*) FILTER (WHERE entity.status NOT IN ('delivered', 'cancelled'))::int", "open")
      .getRawOne<RepairNoteStats>();
    return { total: Number(row?.total ?? 0), open: Number(row?.open ?? 0) };
  }

  private filtered(filters: RepairNoteFilters) {
    const builder = this.scoped();
    if (filters.branchId) builder.andWhere("entity.localId = :branchId", { branchId: filters.branchId });
    if (filters.customerId) builder.andWhere("entity.customerId = :customerId", { customerId: filters.customerId });
    if (filters.assignedEmployeeId) {
      builder.andWhere("entity.assignedEmployeeId = :assignedEmployeeId", {
        assignedEmployeeId: filters.assignedEmployeeId,
      });
    }
    return builder;
  }

  async findByControlNumber(controlNumber: number): Promise<RepairNote | null> {
    return this.scoped()
      .andWhere("entity.controlNumber = :controlNumber", { controlNumber })
      .getOne();
  }

  async findByCustomerId(customerId: string): Promise<RepairNote[]> {
    return this.scoped()
      .andWhere("entity.customerId = :customerId", { customerId })
      .orderBy("entity.receivedAt", "DESC")
      .getMany();
  }
}
