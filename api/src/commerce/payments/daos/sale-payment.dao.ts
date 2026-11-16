import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { SalePayment } from "../entities/sale-payment.entity.js";
import { Sale } from "../../inventory/entities/sale.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class SalePaymentDao extends TenantScopedDao<SalePayment> {
  constructor(@inject(repositoryToken(SalePayment)) repository: Repository<SalePayment>) {
    super(repository);
  }

  async findBySaleId(saleId: string): Promise<SalePayment[]> {
    return this.scoped().andWhere("entity.saleId = :saleId", { saleId }).getMany();
  }

  // Saldo a credito de un cliente -- NUNCA cacheado, siempre la suma de los
  // pagos "credito" de sus ventas (join contra sales, sin agregar una columna
  // customerId redundante a sale_payments).
  async sumCreditoForCustomer(customerId: string): Promise<number> {
    const tenantId = this.currentTenantId();
    const row = await this.scoped()
      .innerJoin(Sale, "sale", "sale.id = entity.saleId AND sale.tenantId = :tenantId", { tenantId })
      .select("COALESCE(SUM(entity.amount), 0)", "total")
      .andWhere("entity.method = 'credito'")
      .andWhere("sale.customerId = :customerId", { customerId })
      .getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }
}
