import type { FC } from "react";
import { SettingsSection } from "./settings-section";
import { ATTRIBUTION_OPTIONS } from "../utils/local-options";
import type { AttributionSectionProps } from "../props/attribution-section-props";

export const AttributionSection: FC<AttributionSectionProps> = ({
  value,
  saving,
  message,
  onChange,
}) => (
  <SettingsSection
    tab="attribution"
    title="Ingresos por empleado"
    description="Qué cuenta como ingreso de cada empleado en el panel. Se guarda al elegir."
  >
    <fieldset disabled={saving} className="relative grid gap-3 md:grid-cols-3">
      <legend className="sr-only">Base de atribución de ingresos</legend>
      {ATTRIBUTION_OPTIONS.map((option) => (
        <label
          key={option.value}
          className="flex min-h-11 cursor-pointer gap-3 rounded-xl border border-gray-200 p-4 transition-colors hover:border-brand-300 has-checked:border-brand-500 has-checked:bg-brand-50 dark:border-gray-700 dark:has-checked:border-brand-400 dark:has-checked:bg-brand-500/10"
        >
          <input
            type="radio"
            name="attributionBasis"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="mt-0.5 size-4 accent-brand-500"
          />
          <span>
            <span className="block text-sm font-semibold text-gray-800 dark:text-white/90">
              {option.label}
            </span>
            <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
              {option.description}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
    {message && (
      <p className="text-xs text-gray-500 dark:text-gray-400" role="status">
        {message}
      </p>
    )}
  </SettingsSection>
);
