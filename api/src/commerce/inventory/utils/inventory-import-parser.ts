import { read, utils } from "xlsx";
import { Decimal } from "decimal.js";
import { toMoney } from "../../../core/common/utils/money.js";
import type { InventoryItemKind } from "../entities/inventory-item.entity.js";

export interface InventoryImportRow {
  name: string;
  sku: string | null;
  kind: InventoryItemKind;
  costPrice: string;
  salePrice: string;
  quantity: number;
}

export interface InventoryImportResult {
  rows: InventoryImportRow[];
  errors: string[];
}

const HEADER_MAP: Record<string, keyof InventoryImportRow> = {
  nombre: "name",
  name: "name",
  sku: "sku",
  codigo: "sku",
  tipo: "kind",
  kind: "kind",
  preciocosto: "costPrice",
  costo: "costPrice",
  costprice: "costPrice",
  precioventa: "salePrice",
  precio: "salePrice",
  saleprice: "salePrice",
  cantidad: "quantity",
  stock: "quantity",
  quantity: "quantity",
};

function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const cellText = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : "";

function parseMoney(value: unknown): Decimal | null {
  if (typeof value === "number") return Number.isFinite(value) ? new Decimal(value) : null;
  if (typeof value !== "string" || value.trim() === "") return null;
  try {
    const parsed = new Decimal(value.trim());
    return parsed.isFinite() ? parsed : null;
  } catch {
    return null;
  }
}

/** Lee un CSV o Excel (xlsx autodetecta el formato por el contenido del buffer). */
export function parseInventoryImportFile(buffer: Buffer): InventoryImportResult {
  const workbook = read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const rows: InventoryImportRow[] = [];
  const errors: string[] = [];

  rawRows.forEach((raw, index) => {
    const mapped: Partial<Record<keyof InventoryImportRow, unknown>> = {};
    for (const [key, value] of Object.entries(raw)) {
      const canonical = HEADER_MAP[normalizeHeader(key)];
      if (canonical) mapped[canonical] = value;
    }

    const rowNumber = index + 2; // +1 por el encabezado, +1 por ser 1-indexado
    const name = cellText(mapped.name).trim();
    const salePrice = parseMoney(mapped.salePrice);

    if (!name) {
      errors.push(`Fila ${rowNumber}: falta el nombre`);
      return;
    }
    if (salePrice === null || salePrice.isNegative()) {
      errors.push(`Fila ${rowNumber}: precio de venta inválido`);
      return;
    }

    const kindRaw = normalizeHeader(cellText(mapped.kind ?? "accessory"));
    const kind: InventoryItemKind =
      kindRaw === "part" || kindRaw === "refaccion" ? "part" : "accessory";
    const costPrice = parseMoney(mapped.costPrice) ?? new Decimal(0);
    const quantity = Number(mapped.quantity) || 0;
    const sku = cellText(mapped.sku).trim();

    rows.push({
      name,
      sku: sku || null,
      kind,
      costPrice: toMoney(costPrice),
      salePrice: toMoney(salePrice),
      quantity,
    });
  });

  return { rows, errors };
}
