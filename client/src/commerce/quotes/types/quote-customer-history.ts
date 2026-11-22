import type { QuoteStatus } from "./quotes";

export interface QuoteHistoryEntry {
  id: string;
  status: QuoteStatus;
  totalValue: number;
}
