import type { FC } from "react";
import { Pagination } from "./pagination";
import type { TablePaginationFooterProps } from "../../../props/table-pagination-footer-props";

const PAGE_SIZES = [10, 25, 50];

export const TablePaginationFooter: FC<TablePaginationFooterProps> = ({
  page,
  pageSize,
  totalPages,
  totalItems,
  startIndex,
  onPageChange,
  onPageSizeChange,
}) => (
  <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <span>Mostrar</span>
      <select
        value={pageSize}
        onChange={(event) => onPageSizeChange(Number(event.target.value))}
        className="h-11 rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-700 md:h-9 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
      >
        {PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <span>
        Mostrando {startIndex + 1}–{Math.min(startIndex + pageSize, totalItems)} de {totalItems}
      </span>
    </div>
    <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
  </div>
);
