import { useMemo, useState } from "react";

import type { PriceListItem } from "./use-price-list";

export const usePriceListPage = ({
  items,
  remove,
  initialSuccessMessage,
}: {
  items: PriceListItem[];
  remove: (id: string) => Promise<boolean>;
  initialSuccessMessage?: string | null;
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(initialSuccessMessage ?? null);
  const [search, setSearch] = useState("");
  const [activeBrand, setActiveBrand] = useState<string>("Todos");
  const [activeSupplier, setActiveSupplier] = useState<string>("Todos");

  const brands = useMemo(() => {
    const set = new Set(items.map((item) => item.brand));
    return ["Todos", ...Array.from(set).sort()];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesBrand = activeBrand === "Todos" || item.brand === activeBrand;
      const matchesSupplier = activeSupplier === "Todos" || item.supplier?.name === activeSupplier;
      const matchesSearch =
        !search ||
        item.model.toLowerCase().includes(search.toLowerCase()) ||
        item.brand.toLowerCase().includes(search.toLowerCase());

      return matchesBrand && matchesSupplier && matchesSearch;
    });
  }, [items, activeBrand, activeSupplier, search]);

  const notify = (message: string) => {
    setSuccessMsg(message);
    window.setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleDelete = async (id: string) => {
    const ok = await remove(id);
    if (ok) notify("Item eliminado.");
    setDeleteConfirmId(null);
  };

  return {
    deleteConfirmId,
    setDeleteConfirmId,
    successMsg,
    search,
    setSearch,
    activeBrand,
    setActiveBrand,
    activeSupplier,
    setActiveSupplier,
    brands,
    filtered,
    handleDelete,
  };
};
