export interface CashSessionRecord {
  id: string;
  localId: string;
  openedByEmployeeId: string | null;
  closedByEmployeeId: string | null;
  openingBalance: number | string;
  closingBalance: number | string | null;
  status: CashSessionStatus;
  variance: number | string | null;
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
  // null: monto en efectivo oculto por arqueo ciego (caja abierta y sin permiso de autorizar).
  amount: number | string | null;
  note: string | null;
  relatedEntityType: CashMovementOrigin;
  relatedEntityId: string | null;
  createdByEmployeeId: string | null;
  createdAt: string;
}

export interface CashAmounts {
  income: string;
  expense: string;
}

export interface CashOriginBreakdown {
  origin: CashMovementOrigin;
  count: number;
  income: string | null;
  expense: string | null;
}

export interface CashHourlyPoint {
  hour: string;
  income: string;
  expense: string;
}

export interface CashSummary {
  amountsHidden: boolean;
  movementCount: number;
  totalIncome: string;
  totalExpense: string;
  net: string;
  byMethod: Record<CashMovementMethod, CashAmounts | null>;
  byOrigin: CashOriginBreakdown[];
  hourly: CashHourlyPoint[] | null;
}

export interface CashCut {
  id: string;
  localId: string;
  openedAt: string;
  closedAt: string | null;
  openedByName: string | null;
  closedByName: string | null;
  openingBalance: string;
  closingBalance: string | null;
  variance: string | null;
  varianceReason: string | null;
  totalIncome: string;
  totalExpense: string;
  movementCount: number;
}

export interface CashVarianceStats {
  month: string;
  closedCount: number;
  withVarianceCount: number;
  shortageTotal: string;
  overageTotal: string;
  netVariance: string;
  averageIncomePerShift: string;
}

export type CashSessionStatus = "open" | "closed";

export type CashMovementType = "income" | "expense";

export type CashMovementMethod = "efectivo" | "tarjeta" | "transferencia";

export type CashMovementOrigin =
  | "sale"
  | "repair_note"
  | "repair_note_item"
  | "layaway"
  | "layaway_item"
  | "return"
  | "customer_payment"
  | "quote"
  | "count"
  | "manual";

export type CashVarianceKind = "shortage" | "overage" | "exact";

export interface CashCutDetail {
  cut: CashCut;
  summary: CashSummary;
  movements: CashMovementRecord[];
  expectedCash: string;
}
