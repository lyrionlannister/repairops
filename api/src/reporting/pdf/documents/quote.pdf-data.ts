import { Decimal } from "decimal.js";
import { Quote } from "../../../commerce/quotes/entities/quote.entity.js";
import { QuoteItem } from "../../../commerce/quotes/entities/quote-item.entity.js";
import { Local } from "../../../app_platform/local/entities/local.entity.js";
import type { BrandPalette } from "../../../app_platform/local/utils/brand-palette.js";
import { moneyString } from "../format-money.js";
import { paletteOf, toPdfLocal, type PdfLocal } from "./pdf-local.js";

export interface QuotePdfData {
  id: string;
  customerName: string;
  contactNumber: string | null;
  totalValue: string;
  validUntil: string | null;
  status: string;
  createdAt: string;
  items: Array<{ description: string; quantity: number; unitPrice: string; subtotal: string }>;
  local: PdfLocal;
  palette: BrandPalette;
}

export function toQuotePdfData(quote: Quote, items: QuoteItem[], local: Local | null): QuotePdfData {
  return {
    id: quote.id,
    customerName: quote.customerName,
    contactNumber: quote.contactNumber ?? null,
    totalValue: moneyString(quote.totalValue),
    validUntil: quote.validUntil ?? null,
    status: quote.status,
    createdAt: quote.createdAt.toISOString().slice(0, 10),
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
