import type { FC } from "react";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";
import { TextArea } from "@ui/textarea/textarea";
import { SettingsSection } from "./settings-section";
import { TICKET_SIZE_OPTIONS } from "../utils/local-options";
import { TIME_ZONES } from "../utils/time-zones";
import type { LocalOperationSectionProps } from "../props/local-operation-section-props";

export const LocalPrintSection: FC<LocalOperationSectionProps> = ({
  form,
  saving,
  onChange,
  onSetField,
}) => (
  <SettingsSection
    tab="print"
    title="Impresión y región"
    description="Formato de los tickets, texto de garantía y la zona horaria del taller."
  >
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <div>
        <Label className="text-gray-500">Tamaño de ticket por defecto</Label>
        <Select
          value={form.defaultTicketSize}
          onChange={(value) => onSetField("defaultTicketSize", value)}
          options={TICKET_SIZE_OPTIONS}
          disabled={saving}
        />
      </div>
      <div>
        <Label className="text-gray-500">Zona horaria</Label>
        <Select
          value={form.timeZone}
          onChange={(value) => onSetField("timeZone", value)}
          options={TIME_ZONES}
          disabled={saving}
        />
        <p className="mt-1 text-xs text-gray-400">
          Define qué es “hoy”, la semana y el mes en el panel y los reportes.
        </p>
      </div>
      <div className="md:col-span-2 xl:col-span-1">
        <Label htmlFor="warrantyClause" className="text-gray-500">
          Cláusula de garantía
        </Label>
        <TextArea
          id="warrantyClause"
          name="warrantyClause"
          rows={3}
          placeholder="Ej. Garantía de 30 días en mano de obra, no cubre daño por líquidos."
          value={form.warrantyClause}
          onChange={onChange}
          disabled={saving}
        />
        <p className="mt-1 text-xs text-gray-400">Aparece impresa al pie de cada nota.</p>
      </div>
    </div>
  </SettingsSection>
);
