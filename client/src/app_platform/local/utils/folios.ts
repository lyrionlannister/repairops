import type { FolioField, FolioFieldConfig, LocalRecord } from "../types/local";

export const FOLIO_FIELDS: readonly FolioFieldConfig[] = [
  { name: "nextControlNumber", label: "Notas de reparación" },
  { name: "nextSaleNumber", label: "Ventas" },
  { name: "nextReturnNumber", label: "Devoluciones" },
  { name: "nextQuoteNumber", label: "Cotizaciones" },
  { name: "nextCutNumber", label: "Cortes de caja" },
  { name: "nextCountNumber", label: "Conteos de inventario" },
];

export const folioFormValues = (local: LocalRecord): Record<FolioField, string> =>
  Object.fromEntries(FOLIO_FIELDS.map(({ name }) => [name, String(local[name])])) as Record<
    FolioField,
    string
  >;

// Solo viajan los folios que el dueño cambió: reenviar el valor cargado al abrir la
// pantalla haría retroceder un contador que avanzó mientras tanto.
export const changedFolios = (
  form: Record<FolioField, string>,
  local: LocalRecord | null,
): Partial<Record<FolioField, number>> =>
  Object.fromEntries(
    FOLIO_FIELDS.flatMap(({ name }) => {
      const value = Number.parseInt(form[name], 10);
      return Number.isNaN(value) || value === local?.[name] ? [] : [[name, value]];
    }),
  );
