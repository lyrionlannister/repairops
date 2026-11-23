import type { FC } from "react";
import { Search } from "lucide-react";
import type { RepairNoteStatusFilter } from "../types/repair-notes";
import type { RepairNotesFilterBarProps } from "../props/repair-notes-filter-bar-props";

export const RepairNotesFilterBar: FC<RepairNotesFilterBarProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) => (
  <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-sm sm:flex-row sm:items-center dark:border-gray-800 dark:bg-gray-900">
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 size-4 text-gray-400" />
      <input
        type="text"
        placeholder="Buscar por cliente, equipo o # control..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-950/60 dark:text-white/90 dark:placeholder:text-gray-500"
      />
    </div>
    <select
      value={statusFilter}
      onChange={(e) => onStatusFilterChange(e.target.value as RepairNoteStatusFilter)}
      className="rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-950/60 dark:text-white/90"
    >
      <option value="all">Todos los estados</option>
      <option value="open">Abiertas</option>
      <option value="received">Recibido</option>
      <option value="in_repair">En Reparación</option>
      <option value="done">Listo</option>
      <option value="delivered">Entregado</option>
      <option value="cancelled">Cancelado</option>
    </select>
  </div>
);
