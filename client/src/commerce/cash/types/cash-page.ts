import type { CashMovementMethod, CashMovementType } from "./cash";

export type CashMovementForm = {
  type: CashMovementType;
  method: CashMovementMethod;
  amount: string;
  note: string;
  createdByEmployeeId: string;
};
