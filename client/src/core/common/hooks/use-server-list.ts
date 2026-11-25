import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApiClient } from "./use-api-client";
import { readApiError } from "../utils/api-error";
import { SEARCH_DEBOUNCE_MS, buildQuery } from "../utils/server-list";
import type { PageResponse, ServerListOptions } from "../types/server-list";

// Lista paginada y filtrada en el servidor: una pantalla con miles de filas descarga
// solo la pagina visible. La respuesta de una peticion vieja (busqueda que ya cambio)
// se descarta, y si el total se reduce la pagina actual se recorta a la ultima valida.
export const useServerList = <T>(path: string, options: ServerListOptions) => {
  const { apiClient } = useApiClient();
  const { search = "", filters, errorText, enabled = true, initialPageSize = 10 } = options;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);
  const filterKey = useMemo(() => buildQuery(filters ?? {}), [filters]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterKey, path]);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams(filterKey);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    try {
      const response = await apiClient(`${path}?${params.toString()}`);
      if (!response.ok) throw new Error(await readApiError(response, errorText));
      const data = (await response.json()) as PageResponse<T>;
      if (seq !== requestSeq.current) return;
      const lastPage = Math.max(1, Math.ceil(data.total / pageSize));
      if (page > lastPage) {
        setPage(lastPage);
        return;
      }
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      if (seq !== requestSeq.current) return;
      setError(err instanceof Error ? err.message : errorText);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [apiClient, path, filterKey, page, pageSize, debouncedSearch, errorText, enabled]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setPage(1);
  };

  return {
    items,
    setItems,
    total,
    loading,
    error,
    refetch,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    startIndex: (page - 1) * pageSize,
    hasSearch: Boolean(debouncedSearch.trim()),
  };
};
