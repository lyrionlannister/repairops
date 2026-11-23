import { Decimal } from "decimal.js";
import type { RepairNote } from "../../../commerce/repair-notes/entities/repair-note.entity.js";
import type { RepairNoteDeviceView } from "../../../commerce/repair-notes/utils/devices.js";
import { Local } from "../../../app_platform/local/entities/local.entity.js";
import type { BrandPalette } from "../../../app_platform/local/utils/brand-palette.js";
import { moneyString } from "../format-money.js";
import { paletteOf, toPdfLocal, type PdfLocal } from "./pdf-local.js";

// Los importes viajan como cadenas decimales de punta a punta; solo se
// formatean al dibujar el documento (ver format-money.ts).
export interface RepairNotePdfData {
  controlNumber: number;
  publicRef: string;
  qrUrl: string | null;
  customerName: string;
  contactNumber: string | null;
  devices: Array<RepairNoteDeviceView & { serviceTypeNames: string[] }>;
  additionalFindings: string | null;
  totalValue: string;
  requiresAdvance: boolean;
  advanceValue: string | null;
  balance: string;
  receivedAt: string;
  receivedTime: string;
  deliveryDate: string | null;
  assignedEmployeeName: string | null;
  technicianNotes: string | null;
  hasWarranty: boolean;
  hasExtendedWarranty: boolean;
  extendedWarrantyDays: number | null;
  local: PdfLocal;
  palette: BrandPalette;
}

export function toRepairNotePdfData(
  note: RepairNote & { devices: RepairNoteDeviceView[] },
  local: Local | null,
  options: {
    assignedEmployeeName?: string | null;
    serviceTypeNames?: (ids: string[]) => string[];
    qrUrl?: string | null;
  } = {},
): RepairNotePdfData {
  const total = new Decimal(note.totalValue ?? 0);
  const advance = note.requiresAdvance && note.advanceValue != null ? new Decimal(note.advanceValue) : new Decimal(0);

  return {
    controlNumber: note.controlNumber,
    publicRef: note.publicRef,
    qrUrl: options.qrUrl ?? null,
    customerName: note.customerName,
    contactNumber: note.contactNumber ?? null,
    devices: note.devices.map((device) => ({
      ...device,
      serviceTypeNames: options.serviceTypeNames?.(device.serviceTypeIds) ?? [],
    })),
    additionalFindings: note.additionalFindings ?? null,
    totalValue: moneyString(total),
    requiresAdvance: note.requiresAdvance,
    advanceValue: note.advanceValue != null ? moneyString(note.advanceValue) : null,
    balance: moneyString(total.minus(advance)),
    receivedAt: note.receivedAt,
    receivedTime: note.receivedTime,
    deliveryDate: note.deliveryDate ?? null,
    assignedEmployeeName: options.assignedEmployeeName ?? null,
    technicianNotes: note.technicianNotes ?? null,
    hasWarranty: note.hasWarranty,
    hasExtendedWarranty: note.hasExtendedWarranty,
    extendedWarrantyDays: note.extendedWarrantyDays ?? null,
    local: toPdfLocal(local),
    palette: paletteOf(local),
  };
}
