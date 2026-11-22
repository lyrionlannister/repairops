import type { FC } from "react";
import { STATUS_CONFIG } from "../hooks/use-repair-notes";
import { SectionTitle } from "./section-title";
import type { RepairNoteStatus } from "../types/repair-notes";
import type { RepairNoteStatusSectionProps } from "../props/repair-note-status-section-props";

export const RepairNoteStatusSection: FC<RepairNoteStatusSectionProps> = ({ status, saving, onStatusChange }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3 space-y-4">
    <SectionTitle>Estado de la nota</SectionTitle>
    <p className="text-sm text-gray-500 dark:text-gray-400">La entrega se hace desde la nota con Entregar, porque cobra el saldo.</p>
    <div className="max-w-xs">
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as RepairNoteStatus)}
        disabled={saving}
        className="w-full rounded-xl border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 dark:border-gray-700 dark:text-white/90"
      >
        {Object.entries(STATUS_CONFIG)
          .filter(([value]) => value !== "delivered" || status === "delivered")
          .map(([value, { label }]) => (
          <option key={value} value={value}>
            {label}
          </option>
          ))}
      </select>
    </div>
  </div>
);
