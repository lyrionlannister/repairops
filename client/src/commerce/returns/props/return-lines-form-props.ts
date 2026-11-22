import type { SaleWithItems, RefundMethod } from "../types/returns";
import type { LineDraft } from "../types/return-refund";

export interface ReturnLinesFormProps {
  sale: SaleWithItems;
  lines: LineDraft[];
  alreadyReturned: Record<string, number>;
  itemNames: Record<string, string>;
  refundMethod: RefundMethod;
  reason: string;
  totalRefunded: number;
  saving: boolean;
  canSubmit: boolean;
  onLineChange: (saleItemId: string, patch: Partial<LineDraft>) => void;
  onRefundMethodChange: (method: RefundMethod) => void;
  onReasonChange: (value: string) => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
}
