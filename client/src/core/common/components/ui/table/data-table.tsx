import type { FC } from "react";
import { Button } from "../button/button";
import { EmptyState } from "./empty-state";
import { ScrollTable } from "./scroll-table";
import { TablePaginationFooter } from "./table-pagination-footer";
import type { DataTableProps } from "../../../props/data-table-props";

export const DataTable: FC<DataTableProps> = ({
  loading = false,
  loadingText = "Cargando...",
  error,
  onRetry,
  isEmpty,
  empty,
  pagination,
  containerClassName = "xl:flex-1 xl:min-h-0",
  toolbar,
  ...table
}) => {
  // Recargar con filas ya pintadas (tras guardar, cambiar de estado, etc.) no
  // vuelve al spinner: la tabla se queda y solo se atenua, sin saltos de alto.
  const initialLoading = loading && isEmpty;
  const showBody = !initialLoading && !error && !isEmpty;

  return (
    <div
      aria-busy={loading}
      className={`flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm transition-opacity dark:border-gray-800 dark:bg-white/3 ${loading && !initialLoading ? "opacity-70" : ""} ${containerClassName}`}
    >
      {toolbar}
      {initialLoading ? (
        <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
          <div className="size-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{loadingText}</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
          <p className="text-sm text-error-500">{error}</p>
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Reintentar
            </Button>
          )}
        </div>
      ) : isEmpty ? (
        <EmptyState {...empty} />
      ) : (
        <ScrollTable {...table} />
      )}

      {showBody && pagination && pagination.totalItems > 0 && (
        <TablePaginationFooter {...pagination} />
      )}
    </div>
  );
};
