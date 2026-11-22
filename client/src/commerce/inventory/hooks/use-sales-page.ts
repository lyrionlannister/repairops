import { useMemo, useState } from "react";
import type { Sale } from "../types/sales";

export const useSalesPage = (sales: Sale[]) => {
  const [search, setSearch] = useState("");

  const filteredSales = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sales;
    return sales.filter(
      (sale) =>
        (sale.customerName ?? "").toLowerCase().includes(term) ||
        String(sale.saleNumber).includes(term),
    );
  }, [search, sales]);

  return { search, setSearch, filteredSales };
};
