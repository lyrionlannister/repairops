import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { RepairNotePayment } from "../entities/repair-note-payment.entity.js";
import { RepairNote } from "../entities/repair-note.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class RepairNotePaymentDao extends TenantScopedDao<RepairNotePayment> {
  constructor(@inject(repositoryToken(RepairNotePayment)) repository: Repository<RepairNotePayment>) {
    super(repository);
  }

  async findByRepairNoteId(repairNoteId: string): Promise<RepairNotePayment[]> {
    return this.scoped()
      .andWhere("entity.repairNoteId = :repairNoteId", { repairNoteId })
      .orderBy("entity.createdAt", "ASC")
      .getMany();
  }

  // Parte del saldo a crédito del cliente que viene de sus notas (nunca cacheada).
  async sumCreditoForCustomer(customerId: string): Promise<number> {
    const tenantId = this.currentTenantId();
    const row = await this.scoped()
      .innerJoin(RepairNote, "note", "note.id = entity.repairNoteId AND note.tenantId = :tenantId", { tenantId })
      .select("COALESCE(SUM(entity.amount), 0)", "total")
      .andWhere("entity.method = 'credito'")
      .andWhere("note.customerId = :customerId", { customerId })
      .getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }

  async findCreditoForCustomer(customerId: string): Promise<Array<RepairNotePayment & { controlNumber: number }>> {
    const tenantId = this.currentTenantId();
    const rows = await this.scoped()
      .innerJoin(RepairNote, "note", "note.id = entity.repairNoteId AND note.tenantId = :tenantId", { tenantId })
      .addSelect("note.controlNumber", "controlNumber")
      .andWhere("entity.method = 'credito'")
      .andWhere("note.customerId = :customerId", { customerId })
      .orderBy("entity.createdAt", "DESC")
      .getRawAndEntities();
    return rows.entities.map((entity, index) => ({
      ...entity,
      controlNumber: Number(rows.raw[index]?.controlNumber),
    }));
  }
}
