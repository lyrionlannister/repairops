import type { TicketSize } from "./local";

export interface LocalFormState {
  name: string;
  address: string;
  phone: string;
  nextControlNumber: string;
  cashRoundingUnit: string;
  logo: string;
  currency: string;
  defaultTicketSize: TicketSize;
  warrantyClause: string;
  brandColor: string;
  timeZone: string;
}

export type AttributionBasis = "total_value" | "margin" | "labor_only";
