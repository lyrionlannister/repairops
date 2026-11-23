import type { FC } from "react";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { SettingsSection } from "./settings-section";
import { FOLIO_FIELDS } from "../utils/folios";
import type { FolioSettingsProps } from "../props/folio-settings-props";

export const FolioSettings: FC<FolioSettingsProps> = ({ values, saving, onChange }) => (
  <SettingsSection
    tab="folios"
    title="Folios"
    description="El siguiente número de cada documento. Debe ser mayor al último ya asignado."
  >
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 2xl:grid-cols-6">
      {FOLIO_FIELDS.map(({ name, label }) => (
        <div key={name}>
          <Label htmlFor={name} className="text-gray-500">
            {label}
          </Label>
          <Input
            id={name}
            type="number"
            name={name}
            min="1"
            step="1"
            value={values[name]}
            onChange={onChange}
            disabled={saving}
          />
        </div>
      ))}
    </div>
  </SettingsSection>
);
