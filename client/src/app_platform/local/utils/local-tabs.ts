import type { LocalFormState, LocalTabConfig, LocalTabKey } from "../types/local-page";
import { FOLIO_FIELDS } from "./folios";

export const LOCAL_TABS: readonly LocalTabConfig[] = [
  {
    key: "identity",
    label: "Identidad",
    fields: ["logo", "brandColor", "name", "phone", "address"],
  },
  { key: "folios", label: "Folios", fields: FOLIO_FIELDS.map(({ name }) => name) },
  { key: "cash", label: "Caja", fields: ["currency", "cashRoundingUnit"] },
  { key: "print", label: "Impresión", fields: ["defaultTicketSize", "timeZone", "warrantyClause"] },
  { key: "attribution", label: "Ingresos", fields: [] },
];

export const DEFAULT_LOCAL_TAB: LocalTabKey = "identity";

export const toLocalTab = (value: string | null): LocalTabKey =>
  LOCAL_TABS.find((tab) => tab.key === value)?.key ?? DEFAULT_LOCAL_TAB;

export const dirtyLocalTabs = (
  form: LocalFormState,
  saved: LocalFormState,
): ReadonlySet<LocalTabKey> =>
  new Set(
    LOCAL_TABS.filter((tab) => tab.fields.some((field) => form[field] !== saved[field])).map(
      (tab) => tab.key,
    ),
  );

export const LOCAL_SETTINGS_FORM_ID = "local-settings-form";
