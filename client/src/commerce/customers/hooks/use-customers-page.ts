import { useEffect, useMemo, useState } from "react";
import type { Customer } from "../types/customers";

export const useCustomersPage = ({
  customers,
  fetchAll,
  fetchDevices,
  remove,
}: {
  customers: Customer[];
  fetchAll: () => Promise<void>;
  fetchDevices: (customerId: string) => Promise<void>;
  remove: (id: string) => Promise<boolean>;
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term) ||
        (c.email ?? "").toLowerCase().includes(term),
    );
  }, [search, customers]);

  const handleDelete = async (id: string) => {
    const ok = await remove(id);
    if (ok) {
      setSuccessMsg("Cliente eliminado.");
      window.setTimeout(() => setSuccessMsg(null), 3000);
    }
    setDeleteConfirmId(null);
  };

  const openHistory = (customer: Customer) => {
    setHistoryCustomer(customer);
    fetchDevices(customer.id);
  };

  const closeHistory = () => setHistoryCustomer(null);

  return {
    deleteConfirmId,
    setDeleteConfirmId,
    successMsg,
    search,
    setSearch,
    filteredCustomers,
    historyCustomer,
    handleDelete,
    openHistory,
    closeHistory,
  };
};
