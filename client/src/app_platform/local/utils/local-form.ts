import type { BrandPalette, LocalRecord } from "../types/local";
import type { LocalFormState } from "../types/local-page";
import { changedFolios, folioFormValues } from "./folios";

export const EMPTY_LOCAL_FORM: LocalFormState = {
  name: "",
  address: "",
  phone: "",
  nextControlNumber: "1",
  nextSaleNumber: "1",
  nextReturnNumber: "1",
  nextQuoteNumber: "1",
  nextCutNumber: "1",
  nextCountNumber: "1",
  cashRoundingUnit: "0",
  logo: "",
  currency: "MXN",
  defaultTicketSize: "80mm",
  warrantyClause: "",
  brandColor: "",
  timeZone: "America/Mexico_City",
};

export const toLocalForm = (local: LocalRecord): LocalFormState => ({
  name: local.name ?? "",
  address: local.address ?? "",
  phone: local.phone ?? "",
  ...folioFormValues(local),
  cashRoundingUnit: String(local.cashRoundingUnit ?? 0),
  logo: local.logo ?? "",
  currency: local.currency ?? "MXN",
  defaultTicketSize: local.defaultTicketSize ?? "80mm",
  warrantyClause: local.warrantyClause ?? "",
  brandColor: local.brandColor ?? "",
  timeZone: local.timeZone ?? "America/Mexico_City",
});

// Solo viaja lo que cambió: un texto vaciado se manda vacío (para borrarlo) y el logo,
// que pesa, no se reenvía en cada guardado.
export const toLocalUpdate = (
  form: LocalFormState,
  saved: LocalFormState,
  local: LocalRecord | null,
): Partial<LocalRecord> => {
  const changed = (key: keyof LocalFormState) => form[key] !== saved[key];
  return {
    ...(changed("name") && { name: form.name }),
    ...(changed("address") && { address: form.address }),
    ...(changed("phone") && { phone: form.phone }),
    ...(changed("logo") && { logo: form.logo }),
    ...(changed("currency") && { currency: form.currency }),
    ...(changed("defaultTicketSize") && { defaultTicketSize: form.defaultTicketSize }),
    ...(changed("warrantyClause") && { warrantyClause: form.warrantyClause }),
    ...(changed("brandColor") && { brandColor: form.brandColor || null }),
    ...(changed("timeZone") && { timeZone: form.timeZone }),
    ...(changed("cashRoundingUnit") && {
      cashRoundingUnit: Number.parseFloat(form.cashRoundingUnit) || 0,
    }),
    ...changedFolios(form, local),
  };
};

export const isSameForm = (a: LocalFormState, b: LocalFormState): boolean =>
  (Object.keys(a) as Array<keyof LocalFormState>).every((key) => a[key] === b[key]);

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const DEFAULT_ACCENT = "#2563eb";

// La vista previa sigue al color mientras se edita; sin uno válido usa el guardado.
export const previewAccent = (brandColor: string, palette: BrandPalette | null): string =>
  HEX_COLOR.test(brandColor) ? brandColor : (palette?.base ?? DEFAULT_ACCENT);
