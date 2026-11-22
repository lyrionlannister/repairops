export interface CashSessionRecord {
  id: string;
  localId: string;
  openedByEmployeeId: string | null;
  openingBalance: number;
  closingBalance: number | null;
  status: CashSessionStatus;
  variance: number | null;
  varianceReason: string | null;
  varianceAuthorizedByEmployeeId: string | null;
  openedAt: string;
  closedAt: string | null;
}

export interface CashMovementRecord {
  id: string;
  cashSessionId: string;
  type: CashMovementType;
  method: CashMovementMethod;
  amount: number;
  note: string | null;
  createdByEmployeeId: string | null;
  createdAt: string;
}

export interface CashSummary {
  totalIncome: number;
  totalExpense: number;
  net: number;
  byMethod: Record<CashMovementMethod, { income: number; expense: number }>;
}

export type CashSessionStatus = "open" | "closed";

export type CashMovementType = "income" | "expense";

export type CashMovementMethod = "efectivo" | "tarjeta" | "transferencia";
