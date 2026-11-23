import type {
  CashMovementMethod,
  CashMovementRelatedEntityType,
} from "../entities/cash-movement.entity.js";

export interface CashAmounts {
  income: string;
  expense: string;
}

export interface CashOriginBreakdown {
  origin: CashMovementRelatedEntityType;
  count: number;
  income: string | null;
  expense: string | null;
}

export interface CashHourlyPoint {
  hour: string;
  income: string;
  expense: string;
}

// amountsHidden: con la sesión abierta, quien no puede autorizar diferencias recibe los totales
// del turno pero no el desglose de efectivo, por origen ni por hora (decisión de producto).
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

export interface CashCutRow {
  id: string;
  publicId: string;
  cutNumber: number;
  localId: string;
  openedAt: Date;
  closedAt: Date | null;
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

export interface CashCutQuery {
  branchId?: string | null;
  sessionId?: string;
  monthOf?: { timeZone: string };
  limit?: number;
}
