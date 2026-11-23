import type { FC } from "react";
import type { DashboardPeriodDays } from "../types/billing-overview";
import type { PeriodToggleProps } from "../props/period-toggle-props";

const OPTIONS: Array<{ value: DashboardPeriodDays; label: string }> = [
  { value: 7, label: "7 días" },
  { value: 30, label: "30 días" },
  { value: 90, label: "90 días" },
];

export const PeriodToggle: FC<PeriodToggleProps> = ({ value, disabled, onChange }) => (
  <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-white/3">
    {OPTIONS.map((option) => (
      <button
        key={option.value}
        type="button"
        disabled={disabled}
        onClick={() => onChange(option.value)}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          value === option.value
            ? "bg-brand-500 text-white"
            : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);
