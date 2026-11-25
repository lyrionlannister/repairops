import { useState } from "react";
import { useSearchParams } from "react-router";
import { useServerList } from "@common/hooks/use-server-list";
import type { Customer, CustomerCreditFilter } from "../types/customers";
import { parseCreditFilter } from "../utils/overdue";

export const useCustomersPage = ({ remove }: { remove: (id: string) => Promise<boolean> }) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const [creditFilter, setCreditFilter] = useState<CustomerCreditFilter>(() =>
    parseCreditFilter(searchParams.get("credit")),
  );

  const list = useServerList<Customer>("/customers", {
    search,
    filters: { credit: creditFilter === "all" ? undefined : creditFilter },
    errorText: "No pudimos cargar los clientes.",
  });

  const handleDelete = async (id: string) => {
    const ok = await remove(id);
    setDeleteConfirmId(null);
    if (ok) await list.refetch();
  };

  return {
    deleteConfirmId,
    setDeleteConfirmId,
    search,
    setSearch,
    creditFilter,
    setCreditFilter,
    list,
    hasFilters: list.hasSearch || creditFilter !== "all",
    handleDelete,
  };
};
