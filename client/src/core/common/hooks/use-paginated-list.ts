import { useMemo, useState } from "react";

// Pagina un array ya filtrado/ordenado en memoria. currentPage se recorta
// contra totalPages en cada render (nunca con useEffect) para que, si una
// busqueda reduce el total y la pagina actual queda fuera de rango, se
// vea la ultima pagina valida sin un render de mas mostrando una lista vacia.
export const usePaginatedList = <T,>(items: T[], initialPageSize = 10) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  const pageItems = useMemo(
    () => items.slice(startIndex, startIndex + pageSize),
    [items, startIndex, pageSize],
  );

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setPage(1);
  };

  return { page: currentPage, setPage, pageSize, setPageSize, totalPages, totalItems, startIndex, pageItems };
};
