import type { FolioField, TicketSize } from "./local";

export type LocalFormState = Record<FolioField, string> & {
  name: string;
  address: string;
  phone: string;
  cashRoundingUnit: string;
  logo: string;
  currency: string;
  defaultTicketSize: TicketSize;
  warrantyClause: string;
  brandColor: string;
  timeZone: string;
};

export type AttributionBasis = "total_value" | "margin" | "labor_only";

export interface AttributionOption {
  value: AttributionBasis;
  label: string;
  description: string;
}

export type LocalFieldChange = (
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
) => void;

export type LocalTabKey = "identity" | "folios" | "cash" | "print" | "attribution";

export interface LocalTabConfig {
  key: LocalTabKey;
  label: string;
  fields: ReadonlyArray<keyof LocalFormState>;
}
