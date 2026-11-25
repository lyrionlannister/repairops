import { useState } from "react";
import { useServerList } from "@common/hooks/use-server-list";
import { useBranchFilter } from "@common/hooks/use-branch-query";
import type { Sale } from "../types/sales";

export const useSalesPage = () => {
  const [search, setSearch] = useState("");
  const branchId = useBranchFilter();
  const list = useServerList<Sale>("/sales", {
    search,
    filters: { branchId },
    errorText: "No pudimos cargar las ventas.",
  });
  return { search, setSearch, list };
};
