import type { FC } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PaginationProps from "../../../types/interfaces/props/pagination-props";

export const Pagination: FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const goTo = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  const pagesToShow = 5;
  const startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
  const endPage = Math.min(totalPages, startPage + pagesToShow - 1);
  const pages: number[] = [];
  for (let i = startPage; i <= endPage; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-4 xl:justify-end">
      <button
        type="button"
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 dark:hover:text-gray-200"
      >
        <ChevronLeft className="size-4" />
      </button>
      <ul className="flex items-center gap-1">
        {startPage > 1 && (
          <li>
            <span className="flex h-10 w-10 items-center justify-center text-sm text-gray-700 dark:text-gray-400">…</span>
          </li>
        )}
        {pages.map((page) => (
          <li key={page}>
            <button
              type="button"
              onClick={() => goTo(page)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium hover:bg-brand-500/8 hover:text-brand-500 ${
                currentPage === page ? "bg-brand-500 text-white" : "text-gray-700 dark:text-gray-400"
              }`}
            >
              {page}
            </button>
          </li>
        ))}
        {endPage < totalPages && (
          <li>
            <span className="flex h-10 w-10 items-center justify-center text-sm text-gray-700 dark:text-gray-400">…</span>
          </li>
        )}
      </ul>
      <button
        type="button"
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 dark:hover:text-gray-200"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
};

