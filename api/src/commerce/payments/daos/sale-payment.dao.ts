import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { SalePayment } from "../entities/sale-payment.entity.js";
import { sumCreditBalance } from "../../customers/utils/credit-balance.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class SalePaymentDao extends TenantScopedDao<SalePayment> {
  constructor(@inject(repositoryToken(SalePayment)) repository: Repository<SalePayment>) {
    super(repository);
  }

  async findBySaleId(saleId: string): Promise<SalePayment[]> {
    return this.scoped().andWhere("entity.saleId = :saleId", { saleId }).getMany();
  }

  // Saldo a crédito de un cliente (ventas y notas) -- NUNCA cacheado; ver credit-balance.ts.
  async sumCreditoForCustomer(customerId: string): Promise<number> {
    return sumCreditBalance(this.repository.manager, this.currentTenantId(), customerId);
  }
}
