import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { SalePayment } from "../entities/sale-payment.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class SalePaymentDao extends TenantScopedDao<SalePayment> {
  constructor(@inject(repositoryToken(SalePayment)) repository: Repository<SalePayment>) {
    super(repository);
  }

  async findBySaleId(saleId: string): Promise<SalePayment[]> {
    return this.scoped().andWhere("entity.saleId = :saleId", { saleId }).getMany();
  }
}
