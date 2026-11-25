import { useEffect, useMemo, useRef, useState } from "react";
import { useApiClient } from "./use-api-client";
import { SEARCH_DEBOUNCE_MS, buildQuery } from "../utils/server-list";
import type { AsyncSearchOptions, ServerListFilters } from "../types/server-list";

// Sugerencias para un selector: pide al servidor solo las primeras coincidencias del
// texto escrito. Una respuesta que llega despues de otra mas nueva se ignora.
export const useAsyncSearch = <T>(
  path: string,
  query: string,
  filters: ServerListFilters = {},
  { enabled = true, limit = 20 }: AsyncSearchOptions = {},
) => {
  const { apiClient } = useApiClient();
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const requestSeq = useRef(0);
  const filterKey = useMemo(() => buildQuery(filters), [filters]);

  useEffect(() => {
    if (!enabled) return;
    const seq = ++requestSeq.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      const params = new URLSearchParams(filterKey);
      params.set("limit", String(limit));
      if (query.trim()) params.set("search", query.trim());
      try {
        const response = await apiClient(`${path}?${params.toString()}`);
        if (seq !== requestSeq.current) return;
        if (!response.ok) throw new Error();
        setResults((await response.json()) as T[]);
        setFailed(false);
      } catch {
        if (seq === requestSeq.current) {
          setResults([]);
          setFailed(true);
        }
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [apiClient, path, filterKey, query, limit, enabled]);

  return { results, loading, failed };
};
