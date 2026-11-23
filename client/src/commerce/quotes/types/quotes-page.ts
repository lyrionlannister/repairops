import type { QuoteKind, QuoteStatus } from "./quotes";

export type QuoteListItem = {
  id: string;
  quoteNumber: number;
  kind: QuoteKind;
  customerName: string;
  contactNumber: string | null;
  status: QuoteStatus;
  validUntil: string | null;
  totalValue: number;
  repairNoteId: string | null;
};
