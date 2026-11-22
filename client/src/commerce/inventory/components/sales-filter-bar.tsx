import type { FC } from "react";
import { Search } from "lucide-react";
import type { SalesFilterBarProps } from "../props/sales-filter-bar-props";

export const SalesFilterBar: FC<SalesFilterBarProps> = ({ search, onSearchChange }) => (
  <div className="relative">
    <Search className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 size-4 text-gray-400" />
    <input
      type="text"
      placeholder="Buscar por cliente o folio..."
      value={search}
      onChange={(e) => onSearchChange(e.target.value)}
      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500"
    />
  </div>
);
