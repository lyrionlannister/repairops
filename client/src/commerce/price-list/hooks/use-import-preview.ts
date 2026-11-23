import { useMemo, useState } from "react";
import { usePaginatedList } from "@common/hooks/use-paginated-list";
import type { StagingRow } from "../types/import-staging";

const ALL_BRANDS = "Todas";

export interface IndexedStagingRow {
  row: StagingRow;
  index: number;
}

// `index` siempre refiere al arreglo completo de `rows`, nunca a la pagina
// local -- onUpdateRow/onRemoveRow del caller dependen de eso.
export const useImportPreview = (rows: StagingRow[]) => {
  const [search, setSearchState] = useState("");
  const [activeBrand, setActiveBrandState] = useState(ALL_BRANDS);

  const brands = useMemo(() => {
    const unique = Array.from(new Set(rows.map((row) => row.brand.trim()).filter(Boolean)));
    unique.sort((a, b) => a.localeCompare(b));
    return [ALL_BRANDS, ...unique];
  }, [rows]);

  const filtered = useMemo<IndexedStagingRow[]>(() => {
    const query = search.trim().toLowerCase();
    return rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => {
        if (activeBrand !== ALL_BRANDS && row.brand !== activeBrand) return false;
        if (!query) return true;
        return row.brand.toLowerCase().includes(query) || row.model.toLowerCase().includes(query);
      });
  }, [rows, search, activeBrand]);

  const { page, setPage, pageSize, setPageSize, totalPages, totalItems, startIndex, pageItems } =
    usePaginatedList(filtered, 25);

  const setSearch = (value: string) => {
    setSearchState(value);
    setPage(1);
  };

  const setActiveBrand = (value: string) => {
    setActiveBrandState(value);
    setPage(1);
  };

  return {
    search,
    setSearch,
    activeBrand,
    setActiveBrand,
    brands,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    startIndex,
    pageItems,
  };
};
