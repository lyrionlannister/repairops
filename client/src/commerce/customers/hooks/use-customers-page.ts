import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import type { Customer, CustomerCreditFilter } from "../types/customers";
import { matchesCreditFilter, parseCreditFilter } from "../utils/overdue";

export const useCustomersPage = ({
  customers,
  fetchAll,
  remove,
}: {
  customers: Customer[];
  fetchAll: () => Promise<void>;
  remove: (id: string) => Promise<boolean>;
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const [creditFilter, setCreditFilter] = useState<CustomerCreditFilter>(() =>
    parseCreditFilter(searchParams.get("credit")),
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return customers.filter(
      (c) =>
        matchesCreditFilter(c, creditFilter) &&
        (!term ||
          c.name.toLowerCase().includes(term) ||
          (c.phone ?? "").toLowerCase().includes(term) ||
          (c.email ?? "").toLowerCase().includes(term)),
    );
  }, [search, creditFilter, customers]);

  const handleDelete = async (id: string) => {
    const ok = await remove(id);
    if (ok) {
      setSuccessMsg("Cliente eliminado.");
      window.setTimeout(() => setSuccessMsg(null), 3000);
    }
    setDeleteConfirmId(null);
  };


  return {
    deleteConfirmId,
    setDeleteConfirmId,
    successMsg,
    search,
    setSearch,
    creditFilter,
    setCreditFilter,
    filteredCustomers,
    handleDelete,
  };
};
