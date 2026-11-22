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
  containerClassName = "flex-1 min-h-0",
  toolbar,
  ...table
}) => {
  const showBody = !loading && !error && !isEmpty;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/3 ${containerClassName}`}
    >
      {toolbar}
      {loading ? (
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
