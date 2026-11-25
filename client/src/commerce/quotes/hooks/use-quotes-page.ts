import { useState } from "react";
import { useServerList } from "@common/hooks/use-server-list";
import { useBranchFilter } from "@common/hooks/use-branch-query";
import type { QuoteStatus } from "../types/quotes";
import type { QuoteListItem } from "../types/quotes-page";

export const useQuotesPage = ({
  deleteQuote,
  setStatus,
}: {
  deleteQuote: (id: string) => Promise<boolean>;
  setStatus: (id: string, status: QuoteStatus) => Promise<boolean>;
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const branchId = useBranchFilter();

  const list = useServerList<QuoteListItem>("/quotes", {
    search,
    filters: { branchId, status: statusFilter === "all" ? undefined : statusFilter },
    errorText: "No pudimos cargar las cotizaciones.",
  });

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const ok = await deleteQuote(id);
    setDeletingId(null);
    if (ok) await list.refetch();
  };

  const handleStatusChange = async (id: string, status: QuoteStatus) => {
    if (await setStatus(id, status)) await list.refetch();
  };

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    deletingId,
    list,
    hasFilters: list.hasSearch || statusFilter !== "all",
    handleDelete,
    handleStatusChange,
  };
};
