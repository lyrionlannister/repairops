import type { FC } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Combobox } from "@ui/combobox/combobox";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { TextArea } from "@ui/textarea/textarea";
import { Button } from "@ui/button/button";
import { ServiceTypeMultiSelect } from "@common/components/service-type-multi-select";
import { SectionTitle } from "./section-title";
import { CheckboxField } from "@ui/checkbox/checkbox-field";
import type { RepairNoteDeviceSectionProps } from "../props/repair-note-device-section-props";

export const RepairNoteDeviceSection: FC<RepairNoteDeviceSectionProps> = ({
  devices,
  serviceTypeIds,
  knownBrands,
  saving,
  onDeviceChange,
  onAddDevice,
  onRemoveDevice,
  onServiceTypeIdsChange,
}) => (
  <>
    {devices.map((device, index) => (
      <div
        key={index}
        className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3"
      >
        <div className="flex items-center justify-between gap-3">
          <SectionTitle>
            {devices.length > 1 ? `Equipo ${index + 1}` : "Datos del equipo"}
          </SectionTitle>
          {devices.length > 1 && (
            <button
              type="button"
              onClick={() => onRemoveDevice(index)}
              disabled={saving}
              aria-label={`Quitar equipo ${index + 1}`}
              className="flex size-11 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-gray-500">
              Marca <span className="text-red-500">*</span>
            </Label>
            <Combobox
              required
              placeholder="Ej. Samsung"
              value={device.brand}
              onChange={(brand) => onDeviceChange(index, { brand })}
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
              value={device.model}
              onChange={(e) => onDeviceChange(index, { model: e.target.value })}
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
              value={device.reportedFailure}
              onChange={(e) => onDeviceChange(index, { reportedFailure: e.target.value })}
              disabled={saving}
              className="mt-1.5"
            />
          </div>
          <div className="sm:col-span-2">
            <CheckboxField
              label="Equipo apagado"
              checked={device.deviceOff}
              onChange={(deviceOff) => onDeviceChange(index, { deviceOff })}
              disabled={saving}
            />
          </div>
        </div>
      </div>
    ))}

    <Button
      type="button"
      variant="outline"
      className="w-full sm:w-auto"
      onClick={onAddDevice}
      disabled={saving}
    >
      <Plus className="mr-1.5 size-4" />
      Agregar otro equipo
    </Button>

    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
      <SectionTitle>Tipo de servicio</SectionTitle>
      <ServiceTypeMultiSelect
        value={serviceTypeIds}
        onChange={onServiceTypeIdsChange}
        disabled={saving}
      />
    </div>
  </>
);
