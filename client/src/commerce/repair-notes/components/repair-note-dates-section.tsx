import type { FC } from "react";
import { DatePicker } from "@ui/date-picker/date-picker";
import { Label } from "@ui/inputs/label";
import { TextArea } from "@ui/textarea/textarea";
import { EmployeeSelect } from "@common/components/employee-select";
import { SectionTitle } from "./section-title";
import type { RepairNoteDatesSectionProps } from "../props/repair-note-dates-section-props";

export const RepairNoteDatesSection: FC<RepairNoteDatesSectionProps> = ({
  receivedAt,
  deliveryDate,
  assignedEmployeeId,
  technicianNotes,
  additionalFindings,
  isEdit,
  saving,
  onReceivedAtChange,
  onDeliveryDateChange,
  onAssignedEmployeeIdChange,
  onTechnicianNotesChange,
  onAdditionalFindingsChange,
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3 space-y-4">
    <SectionTitle>Fechas y técnico</SectionTitle>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <Label className="text-gray-500">
          Fecha de recibido <span className="text-red-500">*</span>
        </Label>
        <DatePicker required value={receivedAt} onChange={onReceivedAtChange} disabled={saving} />
      </div>
      <div>
        <Label className="text-gray-500">Fecha de entrega estimada</Label>
        <DatePicker value={deliveryDate} onChange={onDeliveryDateChange} disabled={saving} />
      </div>
      <div>
        <Label className="text-gray-500">Técnico a cargo</Label>
        <EmployeeSelect
          value={assignedEmployeeId}
          onChange={onAssignedEmployeeIdChange}
          placeholder="Selecciona un técnico"
          disabled={saving}
        />
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <Label className="text-gray-500">Notas del técnico</Label>
        <TextArea
          rows={2}
          placeholder="Observaciones internas del técnico..."
          value={technicianNotes}
          onChange={(e) => onTechnicianNotesChange(e.target.value)}
          disabled={saving}
          className="mt-1.5"
        />
      </div>
      {isEdit && (
        <div className="sm:col-span-2 lg:col-span-3">
          <Label className="text-gray-500">Hallazgos adicionales</Label>
          <p className="mb-1.5 text-xs text-gray-400">
            Fallas nuevas encontradas durante el servicio, distintas a la falla reportada por el cliente.
          </p>
          <TextArea
            rows={2}
            placeholder="Ej. batería inflada, encontrada al abrir el equipo..."
            value={additionalFindings}
            onChange={(e) => onAdditionalFindingsChange(e.target.value)}
            disabled={saving}
          />
        </div>
      )}
    </div>
  </div>
);
