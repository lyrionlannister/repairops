import type { QuoteStatus } from "../types/quotes";

export interface QuoteCustomerHistoryPanelProps {
  otherQuotes: { id: string; status: QuoteStatus; totalValue: number }[];
}
