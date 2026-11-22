import type {
  CashMovementMethod,
  CashMovementOrigin,
  CashMovementRecord,
  CashMovementType,
} from "./cash";

export type CashMovementForm = {
  type: CashMovementType;
  method: CashMovementMethod;
  amount: string;
  note: string;
};

export interface CashMovementFilters {
  type: CashMovementType | "";
  method: CashMovementMethod | "";
  origin: CashMovementOrigin | "";
}

export interface CashMovementRow extends CashMovementRecord {
  originLabel: string;
  originHref: string | null;
  createdByName: string;
}

export interface CashShiftInfo {
  openedByName: string;
  openedAt: string;
  elapsed: string;
  movementCount: number;
}

export interface CashBreakdownRow {
  key: string;
  label: string;
  count: number | null;
  income: string | null;
  expense: string | null;
  share: number;
}

export interface CashFlowSeries {
  categories: string[];
  income: number[];
  expense: number[];
}
