import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PdfRendererService } from "../../../../src/reporting/pdf/pdf-renderer.service.js";
import { RepairNoteDocument } from "../../../../src/reporting/pdf/documents/repair-note.document.js";
import { QuoteDocument } from "../../../../src/reporting/pdf/documents/quote.document.js";
import type { RepairNotePdfData } from "../../../../src/reporting/pdf/documents/repair-note.pdf-data.js";
import type { QuotePdfData } from "../../../../src/reporting/pdf/documents/quote.pdf-data.js";
import { buildBrandPalette } from "../../../../src/app_platform/local/utils/brand-palette.js";
import { formatMoney } from "../../../../src/reporting/pdf/format-money.js";

const local = { name: "Celulares Pérez", address: "Calle 1", phone: "5551234567", logo: null };

const noteData = (overrides: Partial<RepairNotePdfData> = {}): RepairNotePdfData => ({
  controlNumber: 1042,
  publicRef: "7F3K2A9B",
  qrUrl: "https://wa.me/5215512345678?text=Hola%2C%20nota%20%231042",
  customerName: "Juan Pérez",
  contactNumber: "5551234567",
  brand: "Samsung",
  model: "A15",
  reportedFailure: "Pantalla rota",
  additionalFindings: null,
  totalValue: "1500.00",
  requiresAdvance: true,
  advanceValue: "500.00",
  balance: "1000.00",
  receivedAt: "2026-01-10",
  deliveryDate: "2026-01-15",
  assignedEmployeeName: "Luis",
  technicianNotes: "Revisar touch",
  serviceTypeNames: ["Reparación", "Diagnóstico"],
  deviceOff: false,
  hasWarranty: true,
  hasExtendedWarranty: true,
  extendedWarrantyDays: 30,
  local,
  palette: buildBrandPalette("#0f766e"),
  ...overrides,
});

const quoteData = (overrides: Partial<QuotePdfData> = {}): QuotePdfData => ({
  id: "1",
  customerName: "Juan Pérez",
  contactNumber: null,
  totalValue: "600.00",
  validUntil: "2026-02-01",
  status: "pending",
  createdAt: "2026-01-10",
  items: [{ description: "Pantalla", quantity: 1, unitPrice: "600.00", subtotal: "600.00" }],
  local,
  palette: buildBrandPalette(null),
  ...overrides,
});

const renderer = new PdfRendererService();
const isPdf = (buffer: Buffer) => buffer.subarray(0, 5).toString() === "%PDF-";
const pageCount = (buffer: Buffer) => (buffer.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length;

describe("documentos PDF", () => {
  it("la nota se genera con QR y color de marca", async () => {
    expect(isPdf(await renderer.render(RepairNoteDocument, { data: noteData() }))).toBe(true);
  });

  it("la nota se genera sin QR (sin numero de WhatsApp) y con la paleta por defecto", async () => {
    const data = noteData({
      qrUrl: null,
      palette: buildBrandPalette(null),
      assignedEmployeeName: null,
      technicianNotes: null,
    });
    expect(isPdf(await renderer.render(RepairNoteDocument, { data }))).toBe(true);
  });

  it("la nota con textos muy largos fuerza salto de pagina sin error", async () => {
    const long = "texto muy largo ".repeat(900);
    const buffer = await renderer.render(RepairNoteDocument, {
      data: noteData({ technicianNotes: long, reportedFailure: long }),
    });
    expect(isPdf(buffer)).toBe(true);
    expect(pageCount(buffer)).toBeGreaterThan(1);
  });

  it("la cotizacion se genera con muchos renglones y con el color por defecto", async () => {
    const items = Array.from({ length: 80 }, (_, i) => ({
      description: `Pieza ${i}`,
      quantity: 1,
      unitPrice: "10.00",
      subtotal: "10.00",
    }));
    const buffer = await renderer.render(QuoteDocument, { data: quoteData({ items }) });
    expect(isPdf(buffer)).toBe(true);
    expect(pageCount(buffer)).toBeGreaterThan(1);
  });
});

describe("formatMoney", () => {
  it("miles, dos decimales y negativos", () => {
    expect(formatMoney("1234567.5")).toBe("$1,234,567.50");
    expect(formatMoney("0.30")).toBe("$0.30");
    expect(formatMoney("-5")).toBe("-$5.00");
    expect(formatMoney(null)).toBe("—");
  });
});

describe("tema unico", () => {
  it("ningun documento ni componente define colores fuera de theme.ts", () => {
    const root = join(__dirname, "../../../../src/reporting/pdf");
    const files = ["documents", "components"].flatMap((dir) =>
      readdirSync(join(root, dir)).map((f) => join(root, dir, f)),
    );
    expect(files.length).toBeGreaterThan(5);
    for (const file of files) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/#[0-9a-fA-F]{3,8}\b|StyleSheet\.create/);
    }
  });
});
