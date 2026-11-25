import { Decimal } from "decimal.js";
import { singleton } from "tsyringe";
import { CustomerDao } from "../daos/customer.dao.js";
import { CustomerCreditDao } from "../daos/customer-credit.dao.js";
import { Customer } from "../entities/customer.entity.js";
import { LocalService } from "../../../app_platform/local/services/local.service.js";
import { toMoney } from "../../../core/common/utils/money.js";
import { overdueLevel, type OverdueLevel } from "../utils/overdue-level.js";
import type { Page, PageRequest } from "../../../core/common/types/page.types.js";
import type { CustomerCreditFilter } from "../types/customer-page.types.js";

export interface CustomerCreditStatus {
  creditBalance: string;
  overdueBalance: string;
  overdueLevel: OverdueLevel;
}

export type CustomerWithCredit = Customer & CustomerCreditStatus;

export interface CreditPortfolioSummary {
  balance: string;
  overdue: string;
  overdueLevel: OverdueLevel;
  customersWithDebt: number;
  overdueCustomers: number;
}

const NO_DEBT: CustomerCreditStatus = {
  creditBalance: "0.00",
  overdueBalance: "0.00",
  overdueLevel: "none",
};

@singleton()
export class CustomerCreditService {
  constructor(
    private customerDao: CustomerDao,
    private creditDao: CustomerCreditDao,
    private localService: LocalService,
  ) {}

  async listWithCredit(): Promise<CustomerWithCredit[]> {
    return this.attachCredit(await this.customerDao.findAll());
  }

  // Los deudores son pocos frente al catalogo: el filtro de credito se resuelve con el
  // aging de todo el taller y la pagina se corta despues sobre esos ids.
  async listPage(
    request: PageRequest,
    credit: CustomerCreditFilter | undefined,
  ): Promise<Page<CustomerWithCredit>> {
    let ids: string[] | undefined;
    if (credit) {
      const aging = await this.creditDao.findAging(await this.today());
      ids = aging
        .filter((row) => credit === "pending" || new Decimal(row.overdue).greaterThan(0))
        .map((row) => row.customerId);
      if (ids.length === 0) return { items: [], total: 0, page: request.page, pageSize: request.pageSize };
    }
    const page = await this.customerDao.findPage({ search: request.search, ids }, request);
    return { ...page, items: await this.attachCredit(page.items) };
  }

  private async attachCredit(customers: Customer[]): Promise<CustomerWithCredit[]> {
    const aging = await this.creditDao.findAging(
      await this.today(),
      customers.map((c) => c.id),
    );
    const byCustomer = new Map(aging.map((row) => [row.customerId, row]));
    return customers.map((customer) => {
      const row = byCustomer.get(String(customer.id));
      const status: CustomerCreditStatus = row
        ? {
            creditBalance: toMoney(row.balance),
            overdueBalance: toMoney(row.overdue),
            overdueLevel: overdueLevel(row.balance, row.overdue),
          }
        : NO_DEBT;
      return Object.assign(customer, status);
    });
  }

  async getPortfolioSummary(): Promise<CreditPortfolioSummary> {
    const aging = await this.creditDao.findAging(await this.today());
    const balance = aging.reduce((sum, row) => sum.plus(row.balance), new Decimal(0));
    const overdue = aging.reduce((sum, row) => sum.plus(row.overdue), new Decimal(0));
    return {
      balance: toMoney(balance),
      overdue: toMoney(overdue),
      overdueLevel: overdueLevel(balance, overdue),
      customersWithDebt: aging.length,
      overdueCustomers: aging.filter((row) => new Decimal(row.overdue).greaterThan(0)).length,
    };
  }

  private async today(): Promise<string> {
    const { timeZone } = await this.localService.getConfig();
    return new Date().toLocaleDateString("en-CA", { timeZone });
  }
}
