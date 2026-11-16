import { useMemo, useState } from "react";
import type { Supplier } from "./use-suppliers";

export const useSuppliersPage = (suppliers: Supplier[]) => {
  const [search, setSearch] = useState("");

  const filteredSuppliers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return suppliers;
    return suppliers.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(term) || supplier.phone.toLowerCase().includes(term),
    );
  }, [search, suppliers]);

  return { search, setSearch, filteredSuppliers };
};
