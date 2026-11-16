import type { FC } from "react";
import { STATUS_CONFIG, type RepairNoteStatus } from "../hooks/use-repair-notes";
import { SectionTitle } from "./section-title";

interface RepairNoteStatusSectionProps {
  status: RepairNoteStatus;
  saving: boolean;
  onStatusChange: (status: RepairNoteStatus) => void;
}

export const RepairNoteStatusSection: FC<RepairNoteStatusSectionProps> = ({ status, saving, onStatusChange }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3 space-y-4">
    <SectionTitle>Estado de la nota</SectionTitle>
    <div className="max-w-xs">
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as RepairNoteStatus)}
        disabled={saving}
        className="w-full rounded-xl border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 dark:border-gray-700 dark:text-white/90"
      >
        {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  </div>
);
