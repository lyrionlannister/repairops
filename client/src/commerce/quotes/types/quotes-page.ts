import type { QuoteKind, QuoteStatus } from "./quotes";

export type QuoteListItem = {
  id: string;
  kind: QuoteKind;
  customerName: string;
  contactNumber: string | null;
  status: QuoteStatus;
  validUntil: string | null;
  totalValue: number;
  repairNoteId: string | null;
};
