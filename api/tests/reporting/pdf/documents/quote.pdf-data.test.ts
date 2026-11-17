import { describe, expect, it } from "vitest";
import { toQuotePdfData } from "../../../../src/reporting/pdf/documents/quote.pdf-data.js";
import type { Quote } from "../../../../src/commerce/quotes/entities/quote.entity.js";
import type { QuoteItem } from "../../../../src/commerce/quotes/entities/quote-item.entity.js";
import type { Local } from "../../../../src/app_platform/local/entities/local.entity.js";

function makeQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: "1",
    customerName: "Juan Pérez",
    contactNumber: "555",
    totalValue: "600.00",
    validUntil: "2026-02-01",
    status: "pending",
    createdAt: new Date("2026-01-10T00:00:00.000Z"),
    ...overrides,
  } as unknown as Quote;
}

function makeItem(overrides: Partial<QuoteItem> = {}): QuoteItem {
  return { description: "Pantalla", quantity: 1, unitPrice: "500.00", ...overrides } as unknown as QuoteItem;
}

describe("toQuotePdfData", () => {
  it("entrega el dinero como cadenas decimales y calcula subtotales exactos", () => {
    const data = toQuotePdfData(makeQuote(), [makeItem({ quantity: 3, unitPrice: "0.10" as never })], null);

    expect(data.totalValue).toBe("600.00");
    expect(data.items).toEqual([{ description: "Pantalla", quantity: 3, unitPrice: "0.10", subtotal: "0.30" }]);
  });

  it("usa null para contactNumber/validUntil ausentes", () => {
    const data = toQuotePdfData(makeQuote({ contactNumber: undefined, validUntil: undefined }), [], null);

    expect(data.contactNumber).toBeNull();
    expect(data.validUntil).toBeNull();
  });

  it("mapea los datos del local cuando existe", () => {
    const local = { name: "Mi Taller", address: null, phone: "555", logo: null } as Local;
    const data = toQuotePdfData(makeQuote(), [], local);

    expect(data.local.name).toBe("Mi Taller");
  });
});
