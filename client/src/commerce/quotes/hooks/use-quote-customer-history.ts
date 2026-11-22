import { useEffect, useMemo } from "react";
import { useQuotes } from "./use-quotes";
import type { QuoteHistoryEntry } from "../types/quote-customer-history";

export const useQuoteCustomerHistory = (customerId: string | null, excludeId?: string) => {
  const { quotes, fetchQuotes } = useQuotes();

  useEffect(() => {
    if (customerId) fetchQuotes();
  }, [customerId, fetchQuotes]);

  const otherQuotes = useMemo<QuoteHistoryEntry[]>(
    () =>
      customerId
        ? quotes
            .filter((q) => q.customerId === customerId && q.id !== excludeId)
            .map((q) => ({ id: q.id, status: q.status, totalValue: Number(q.totalValue) }))
        : [],
    [quotes, customerId, excludeId],
  );

  return { otherQuotes };
};
