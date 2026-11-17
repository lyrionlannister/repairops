import { Decimal } from "decimal.js";
import { Quote, QuoteKind } from "../../../commerce/quotes/entities/quote.entity.js";
import { QuoteItem } from "../../../commerce/quotes/entities/quote-item.entity.js";
import { Local } from "../../../app_platform/local/entities/local.entity.js";
import type { BrandPalette } from "../../../app_platform/local/utils/brand-palette.js";
import { moneyString } from "../format-money.js";
import { paletteOf, toPdfLocal, type PdfLocal } from "./pdf-local.js";

export interface QuotePdfData {
  id: string;
  kind: QuoteKind;
  customerName: string;
  contactNumber: string | null;
  brand: string | null;
  model: string | null;
  reportedFailure: string | null;
  serviceTypeNames: string[];
  totalValue: string;
  validUntil: string | null;
  status: string;
  createdAt: string;
  items: Array<{ description: string; quantity: number; unitPrice: string; subtotal: string }>;
  local: PdfLocal;
  palette: BrandPalette;
}

export function toQuotePdfData(
  quote: Quote,
  items: QuoteItem[],
  local: Local | null,
  options: { serviceTypeNames?: string[] } = {},
): QuotePdfData {
  return {
    id: quote.id,
    kind: quote.kind,
    customerName: quote.customerName,
    contactNumber: quote.contactNumber ?? null,
    brand: quote.brand ?? null,
    model: quote.model ?? null,
    reportedFailure: quote.reportedFailure ?? null,
    serviceTypeNames: options.serviceTypeNames ?? [],
    totalValue: moneyString(quote.totalValue),
    validUntil: quote.validUntil ?? null,
    status: quote.status,
    // Dia en la zona horaria del taller (no el dia UTC del servidor).
    createdAt: quote.createdAt.toLocaleDateString("en-CA", { timeZone: local?.timeZone ?? "America/Mexico_City" }),
    items: items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: moneyString(item.unitPrice),
      subtotal: moneyString(new Decimal(item.unitPrice).times(item.quantity)),
    })),
    local: toPdfLocal(local),
    palette: paletteOf(local),
  };
}
