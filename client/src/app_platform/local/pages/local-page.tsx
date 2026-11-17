import { Store } from "lucide-react";

import { useApiClient } from "@common/hooks/use-api-client";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { TextArea } from "@ui/textarea/textarea";
import { PageShell } from "@common/components/page-shell/page-shell";

import { BrandColorField } from "../components/brand-color-field";
import { TIME_ZONES } from "../utils/time-zones";
import { useLocal } from "../hooks/use-local";
import { useLocalPage } from "../hooks/use-local-page";

export const LocalPage = () => {
  const { apiClient } = useApiClient();
  const { local, loading, saving, saveSuccess, error, fetchLocal, updateLocal } = useLocal();
  const {
    fileInputRef,
    form,
    attributionBasis,
    attributionSaving,
    attributionMessage,
    handleChange,
    handleLogoChange,
    handleAttributionBasisChange,
    handleSubmit,
    removeLogo,
    setBrandColor,
  } = useLocalPage({
    local,
    loading,
    saving,
    saveSuccess,
    error,
    fetchLocal,
    updateLocal,
    apiClient,
  });

  if (loading) {
    return <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando configuración...</div>;
  }

  return (
    <PageShell title="Configuración del Local" description="Datos que aparecerán en las notas de reparación impresas.">

      <form onSubmit={handleSubmit}>
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
                  <Button type="button" variant="outline" onClick={removeLogo}>
                    Quitar logo
                  </Button>
                )}
                <p className="text-xs text-gray-400">PNG, JPG. Recomendado: 200×200px.</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          <BrandColorField value={form.brandColor} palette={local?.brandPalette ?? null} disabled={saving} onChange={setBrandColor} />

          <hr className="border-gray-100 dark:border-gray-800" />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label className="text-gray-500">Nombre del local</Label>
              <Input name="name" placeholder="Ej. Kaltra Fix" value={form.name} onChange={handleChange} disabled={saving} required />
            </div>
            <div>
              <Label className="text-gray-500">Teléfono</Label>
              <Input name="phone" placeholder="Ej. 833 266 2225" value={form.phone} onChange={handleChange} disabled={saving} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-gray-500">Dirección</Label>
              <Input name="address" placeholder="Ej. Benito Juárez 304 Local 107-109, Zona Centro" value={form.address} onChange={handleChange} disabled={saving} />
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          <div className="max-w-xs">
            <Label className="text-gray-500">Número de control inicial</Label>
            <Input type="number" name="nextControlNumber" min="1" placeholder="1" value={form.nextControlNumber} onChange={handleChange} disabled={saving} />
            <p className="mt-1 text-xs text-gray-400">El próximo consecutivo que se asignará a una nota nueva.</p>
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          <div className="max-w-xs">
            <Label className="text-gray-500">Unidad de redondeo de caja (efectivo)</Label>
            <Input type="number" name="cashRoundingUnit" min="0" step="0.01" placeholder="0 = sin redondeo" value={form.cashRoundingUnit} onChange={handleChange} disabled={saving} />
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
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
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
              onChange={handleAttributionBasisChange}
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
    </PageShell>
  );
};

