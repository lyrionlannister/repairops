import { useMemo, useState } from "react";
import type { QuoteStatus } from "../types/quotes";
import type { QuoteListItem } from "../types/quotes-page";

export const useQuotesPage = ({
  quotes,
  deleteQuote,
  setStatus,
}: {
  quotes: QuoteListItem[];
  deleteQuote: (id: string) => Promise<boolean>;
  setStatus: (id: string, status: QuoteStatus) => Promise<boolean>;
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const matchesSearch = quote.customerName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotes, search, statusFilter]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteQuote(id);
    setDeletingId(null);
  };

  const handleStatusChange = async (id: string, status: QuoteStatus) => {
    await setStatus(id, status);
  };

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    deletingId,
    filteredQuotes,
    handleDelete,
    handleStatusChange,
  };
};
