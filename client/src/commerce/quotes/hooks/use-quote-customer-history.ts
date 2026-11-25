import { useMemo } from "react";
import { useApiResource } from "@common/hooks/use-api-resource";
import type { QuoteListItem } from "../types/quotes-page";
import type { QuoteHistoryEntry } from "../types/quote-customer-history";

export const useQuoteCustomerHistory = (customerId: string | null, excludeId?: string) => {
  const { data } = useApiResource<QuoteListItem[]>(
    customerId ? `/quotes?customerId=${encodeURIComponent(customerId)}` : null,
  );

  const otherQuotes = useMemo<QuoteHistoryEntry[]>(
    () =>
      (data ?? [])
        .filter((q) => q.id !== excludeId)
        .map((q) => ({ id: q.id, status: q.status, totalValue: Number(q.totalValue) })),
    [data, excludeId],
  );

  return { otherQuotes };
};
