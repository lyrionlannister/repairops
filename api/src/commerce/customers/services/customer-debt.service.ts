import { Decimal } from "decimal.js";
import { singleton } from "tsyringe";
import AppDataSource from "../../../core/config/data-source.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { CustomerDao } from "../daos/customer.dao.js";
import { listCreditDebts, sumCreditBalance, type CreditDebtRow } from "../utils/credit-balance.js";

export interface CustomerDebts {
  creditLimit: number;
  balance: number;
  available: number;
  items: CreditDebtRow[];
}

// Deudas del cliente: cada venta o nota que quedó (en parte) a crédito. El
// saldo (sumCreditBalance) ya resta los abonos -- items es solo lo fiado,
// para mostrar de dónde viene la deuda.
@singleton()
export class CustomerDebtService {
  constructor(private customerDao: CustomerDao) {}

  async getDebts(customerId: string): Promise<CustomerDebts | null> {
    const customer = await this.customerDao.findById(customerId);
    if (!customer) return null;
    const tenantId = getCurrentTenantId();
    const [balance, items] = await Promise.all([
      sumCreditBalance(AppDataSource.manager, tenantId, customerId),
      listCreditDebts(AppDataSource.manager, tenantId, customerId),
    ]);
    const creditLimit = new Decimal(customer.creditLimit);
    return {
      creditLimit: creditLimit.toNumber(),
      balance: new Decimal(balance).toNumber(),
      available: creditLimit.minus(balance).toNumber(),
      items,
    };
  }
}
