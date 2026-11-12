import { Repository } from "typeorm";
import { SalePayment } from "../entities/sale-payment.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

export class SalePaymentDao extends TenantScopedDao<SalePayment> {
  constructor(repository: Repository<SalePayment>) {
    super(repository);
  }

  async findBySaleId(saleId: string): Promise<SalePayment[]> {
    return this.scoped().andWhere("entity.saleId = :saleId", { saleId }).getMany();
  }
}
