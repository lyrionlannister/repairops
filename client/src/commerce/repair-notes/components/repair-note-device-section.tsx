import type { FC } from "react";
import { Combobox } from "@ui/combobox/combobox";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { TextArea } from "@ui/textarea/textarea";
import { ServiceTypeMultiSelect } from "@common/components/service-type-multi-select";
import { SectionTitle } from "./section-title";
import { CheckboxField } from "@ui/checkbox/checkbox-field";
import type { RepairNoteDeviceSectionProps } from "../props/repair-note-device-section-props";

export const RepairNoteDeviceSection: FC<RepairNoteDeviceSectionProps> = ({
  brand,
  model,
  reportedFailure,
  serviceTypeIds,
  deviceOff,
  knownBrands,
  saving,
  onBrandChange,
  onModelChange,
  onReportedFailureChange,
  onServiceTypeIdsChange,
  onDeviceOffChange,
}) => (
  <>
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3 space-y-4">
      <SectionTitle>Datos del equipo</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-gray-500">
            Marca <span className="text-red-500">*</span>
          </Label>
          <Combobox
            required
            placeholder="Ej. Samsung"
            value={brand}
            onChange={onBrandChange}
            options={knownBrands}
            disabled={saving}
          />
        </div>
        <div>
          <Label className="text-gray-500">
            Modelo <span className="text-red-500">*</span>
          </Label>
          <Input
            required
            placeholder="Ej. S7 Edge"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={saving}
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-gray-500">
            Falla reportada <span className="text-red-500">*</span>
          </Label>
          <TextArea
            required
            rows={3}
            placeholder="Describe la falla reportada por el cliente..."
            value={reportedFailure}
            onChange={(e) => onReportedFailureChange(e.target.value)}
            disabled={saving}
            className="mt-1.5"
          />
        </div>
      </div>
    </div>

    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3 space-y-4">
      <SectionTitle>Tipo de servicio</SectionTitle>
      <ServiceTypeMultiSelect value={serviceTypeIds} onChange={onServiceTypeIdsChange} disabled={saving} />
      <CheckboxField label="Equipo apagado" checked={deviceOff} onChange={onDeviceOffChange} disabled={saving} />
    </div>
  </>
);
