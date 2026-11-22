import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { Quote } from "../entities/quote.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";
import { can, currentUserId } from "../../../identity/authz/access.js";

// quotes.read.own (el técnico): solo cotizaciones ligadas a notas asignadas a él.
function ownQuotesOnly(): string | null {
  return !can("quotes.read") && can("quotes.read.own") ? currentUserId() : null;
}

const OWN_NOTES = `SELECT rn.id FROM repair_notes rn
  WHERE rn.tenant_id = :tenantId AND rn.id_empleado_asignado = :ownQuotesUserId`;

@singleton()
export class QuoteDao extends TenantScopedDao<Quote> {
  constructor(@inject(repositoryToken(Quote)) repository: Repository<Quote>) {
    super(repository);
  }

  protected override scoped(alias = "entity") {
    const query = super.scoped(alias);
    const userId = ownQuotesOnly();
    if (userId) query.andWhere(`${alias}.repairNoteId IN (${OWN_NOTES})`, { ownQuotesUserId: userId });
    return query;
  }

  override async findById(id: string | number): Promise<Quote | null> {
    if (!ownQuotesOnly()) return super.findById(id);
    return this.scoped().andWhere("entity.id = :id", { id }).getOne();
  }

  override async update(id: string | number, data: Partial<Quote>): Promise<Quote | null> {
    if (!(await this.findById(id))) return null;
    return super.update(id, data);
  }

  override async delete(id: string | number): Promise<boolean> {
    if (!(await this.findById(id))) return false;
    return super.delete(id);
  }

  async findAllOrdered(branchId?: string | null): Promise<Quote[]> {
    return this.scoped()
      .andWhere(branchId ? "entity.localId = :branchId" : "1 = 1", { branchId })
      .orderBy("entity.createdAt", "DESC").getMany();
  }
}
