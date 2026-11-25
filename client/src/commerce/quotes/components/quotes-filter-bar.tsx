import type { FC } from "react";
import { Search } from "lucide-react";
import type { QuoteStatus } from "../types/quotes";
import type { QuotesFilterBarProps } from "../props/quotes-filter-bar-props";

export const QuotesFilterBar: FC<QuotesFilterBarProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 size-4 text-gray-400" />
      <input
        type="text"
        placeholder="Buscar por cliente, folio o equipo..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500"
      />
    </div>
    <select
      value={statusFilter}
      onChange={(e) => onStatusFilterChange(e.target.value as QuoteStatus | "all")}
      className="rounded-xl border border-gray-200 bg-white py-2.5 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
    >
      <option value="all">Todos los estados</option>
      <option value="pending">Pendiente</option>
      <option value="accepted">Aceptada</option>
      <option value="rejected">Rechazada</option>
    </select>
  </div>
);
