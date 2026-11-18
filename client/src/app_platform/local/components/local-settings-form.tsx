import type { FC, RefObject } from "react";
import { Store } from "lucide-react";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { TextArea } from "@ui/textarea/textarea";

import type { LocalRecord } from "../hooks/use-local";
import type { LocalFormState, AttributionBasis } from "../hooks/use-local-page";
import { BrandColorField } from "./brand-color-field";
import { TIME_ZONES } from "../utils/time-zones";

interface LocalSettingsFormProps {
  local: LocalRecord | null;
  form: LocalFormState;
  saving: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  attributionBasis: AttributionBasis;
  attributionSaving: boolean;
  attributionMessage: string | null;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onLogoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAttributionBasisChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onRemoveLogo: () => void;
  onSetBrandColor: (color: string) => void;
}

export const LocalSettingsForm: FC<LocalSettingsFormProps> = ({
  local,
  form,
  saving,
  fileInputRef,
  attributionBasis,
  attributionSaving,
  attributionMessage,
  onChange,
  onLogoChange,
  onAttributionBasisChange,
  onSubmit,
  onRemoveLogo,
  onSetBrandColor,
}) => (
  <form onSubmit={onSubmit}>
    <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
      <div>
        <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Logo del local</p>
        <div className="flex items-center gap-4">
          <div className="flex size-24 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900">
            {form.logo ? (
              <img src={form.logo} alt="Logo" className="size-full object-contain" />
            ) : (
              <Store className="size-8 text-gray-400" />
            )}
          </div>
          <div className="space-y-2">
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              {form.logo ? "Cambiar logo" : "Subir logo"}
            </Button>
            {form.logo && (
              <Button type="button" variant="outline" onClick={onRemoveLogo}>
                Quitar logo
              </Button>
            )}
            <p className="text-xs text-gray-400">PNG, JPG. Recomendado: 200×200px.</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
        </div>
      </div>

      <hr className="border-gray-100 dark:border-gray-800" />

      <BrandColorField value={form.brandColor} palette={local?.brandPalette ?? null} disabled={saving} onChange={onSetBrandColor} />

      <hr className="border-gray-100 dark:border-gray-800" />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label className="text-gray-500">Nombre del local</Label>
          <Input name="name" placeholder="Ej. Kaltra Fix" value={form.name} onChange={onChange} disabled={saving} required />
        </div>
        <div>
          <Label className="text-gray-500">Teléfono</Label>
          <Input name="phone" placeholder="Ej. 833 266 2225" value={form.phone} onChange={onChange} disabled={saving} />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-gray-500">Dirección</Label>
          <Input name="address" placeholder="Ej. Benito Juárez 304 Local 107-109, Zona Centro" value={form.address} onChange={onChange} disabled={saving} />
        </div>
      </div>

      <hr className="border-gray-100 dark:border-gray-800" />

      <div className="max-w-xs">
        <Label className="text-gray-500">Número de control inicial</Label>
        <Input type="number" name="nextControlNumber" min="1" placeholder="1" value={form.nextControlNumber} onChange={onChange} disabled={saving} />
        <p className="mt-1 text-xs text-gray-400">El próximo consecutivo que se asignará a una nota nueva.</p>
      </div>

      <hr className="border-gray-100 dark:border-gray-800" />

      <div className="max-w-xs">
        <Label className="text-gray-500">Unidad de redondeo de caja (efectivo)</Label>
        <Input type="number" name="cashRoundingUnit" min="0" step="0.01" placeholder="0 = sin redondeo" value={form.cashRoundingUnit} onChange={onChange} disabled={saving} />
        <p className="mt-1 text-xs text-gray-400">
          Ej. 0.50 redondea cobros en efectivo al 50 centavos más cercano. 0 desactiva el redondeo. Tarjeta y transferencia nunca redondean.
        </p>
      </div>

      <hr className="border-gray-100 dark:border-gray-800" />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label className="text-gray-500">Moneda</Label>
          <select
            name="currency"
            value={form.currency}
            onChange={onChange}
            disabled={saving}
            className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-3 md:py-2 text-sm text-gray-700 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="MXN">Peso mexicano (MXN)</option>
            <option value="USD">Dólar estadounidense (USD)</option>
          </select>
        </div>
        <div>
          <Label className="text-gray-500">Tamaño de ticket por defecto</Label>
          <select
            name="defaultTicketSize"
            value={form.defaultTicketSize}
            onChange={onChange}
            disabled={saving}
            className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-3 md:py-2 text-sm text-gray-700 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="58mm">Térmico 58mm</option>
            <option value="80mm">Térmico 80mm</option>
            <option value="letter">Carta</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label className="text-gray-500">Zona horaria</Label>
          <select
            name="timeZone"
            value={form.timeZone}
            onChange={onChange}
            disabled={saving}
            className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-3 md:py-2 text-sm text-gray-700 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            {TIME_ZONES.map((zone) => (
              <option key={zone.value} value={zone.value}>
                {zone.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">Define qué es "hoy", la semana y el mes en el panel y los reportes.</p>
        </div>
        <div className="sm:col-span-2">
          <Label className="text-gray-500">Cláusula de garantía (aparece impresa en el ticket)</Label>
          <TextArea
            name="warrantyClause"
            rows={3}
            placeholder="Ej. Garantía de 30 días en mano de obra, no cubre daño por líquidos."
            value={form.warrantyClause}
            onChange={onChange}
            disabled={saving}
            className="mt-1"
          />
        </div>
      </div>

      <hr className="border-gray-100 dark:border-gray-800" />

      <div className="max-w-md">
        <Label className="text-gray-500">Base de atribución de ingresos</Label>
        <select
          value={attributionBasis}
          onChange={onAttributionBasisChange}
          disabled={attributionSaving}
          className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-3 md:py-2 text-sm text-gray-700 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          <option value="total_value">Total cobrado</option>
          <option value="margin">Margen (ingreso - costo de los items)</option>
          <option value="labor_only">Solo mano de obra</option>
        </select>
        <p className="mt-1 text-xs text-gray-400">Define cómo se calcula el ingreso atribuido a cada empleado en el dashboard.</p>
        {attributionMessage && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{attributionMessage}</p>}
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </div>
  </form>
);
