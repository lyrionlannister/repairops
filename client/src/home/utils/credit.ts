import type { CreditPortfolio } from "../types/dashboard-page";
import { formatMoney } from "./format";

const customers = (count: number): string => `${count} ${count === 1 ? "cliente" : "clientes"}`;

export const creditHint = (credit: CreditPortfolio): string =>
  credit.overdueCustomers > 0
    ? `${formatMoney(credit.overdue)} en mora · ${customers(credit.overdueCustomers)}`
    : `${customers(credit.customersWithDebt)} con saldo, al corriente`;
