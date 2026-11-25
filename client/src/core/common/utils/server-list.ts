import type { ServerListFilters } from "../types/server-list";

export const SEARCH_DEBOUNCE_MS = 300;

// Orden estable de claves: el mismo filtro produce siempre la misma cadena, asi la
// cadena sirve de dependencia de efectos sin re-disparar por un objeto nuevo.
export const buildQuery = (filters: ServerListFilters): string => {
  const params = new URLSearchParams();
  for (const key of Object.keys(filters).sort()) {
    const value = filters[key];
    if (value !== undefined && value !== null && value !== "") params.set(key, value);
  }
  return params.toString();
};
