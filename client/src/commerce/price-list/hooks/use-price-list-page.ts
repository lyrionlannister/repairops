import { useCallback, useEffect, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import { useServerList } from "@common/hooks/use-server-list";
import type { PriceListItem } from "../types/price-list";

export const ALL_OPTION = "";

export const usePriceListPage = ({
  remove,
  initialSuccessMessage,
}: {
  remove: (id: string) => Promise<boolean>;
  initialSuccessMessage?: string | null;
}) => {
  const { apiClient } = useApiClient();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(initialSuccessMessage ?? null);
  const [search, setSearch] = useState("");
  const [activeBrand, setActiveBrand] = useState(ALL_OPTION);
  const [activeSupplierId, setActiveSupplierId] = useState(ALL_OPTION);
  const [brands, setBrands] = useState<string[]>([]);

  const list = useServerList<PriceListItem>("/price-list", {
    search,
    filters: { brand: activeBrand || undefined, supplierId: activeSupplierId || undefined },
    errorText: "No pudimos cargar la lista de precios.",
  });

  const fetchBrands = useCallback(async () => {
    try {
      const response = await apiClient("/price-list/brands");
      if (response.ok) setBrands((await response.json()) as string[]);
    } catch {
      setBrands([]);
    }
  }, [apiClient]);

  useEffect(() => {
    void fetchBrands();
  }, [fetchBrands]);

  const notify = (message: string) => {
    setSuccessMsg(message);
    window.setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleDelete = async (id: string) => {
    const ok = await remove(id);
    setDeleteConfirmId(null);
    if (ok) {
      notify("Producto eliminado.");
      await Promise.all([list.refetch(), fetchBrands()]);
    }
  };

  return {
    list,
    deleteConfirmId,
    setDeleteConfirmId,
    successMsg,
    search,
    setSearch,
    activeBrand,
    setActiveBrand,
    activeSupplierId,
    setActiveSupplierId,
    brands,
    hasFilters: list.hasSearch || Boolean(activeBrand) || Boolean(activeSupplierId),
    handleDelete,
  };
};
