import { Decimal } from "decimal.js";
import { RepairNote } from "../../../commerce/repair-notes/entities/repair-note.entity.js";
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
  brand: string;
  model: string;
  reportedFailure: string;
  additionalFindings: string | null;
  totalValue: string;
  requiresAdvance: boolean;
  advanceValue: string | null;
  balance: string;
  receivedAt: string;
  deliveryDate: string | null;
  assignedEmployeeName: string | null;
  technicianNotes: string | null;
  serviceTypeNames: string[];
  deviceOff: boolean;
  hasWarranty: boolean;
  hasExtendedWarranty: boolean;
  extendedWarrantyDays: number | null;
  local: PdfLocal;
  palette: BrandPalette;
}

export function toRepairNotePdfData(
  note: RepairNote,
  local: Local | null,
  options: { assignedEmployeeName?: string | null; serviceTypeNames?: string[]; qrUrl?: string | null } = {},
): RepairNotePdfData {
  const total = new Decimal(note.totalValue ?? 0);
  const advance = note.requiresAdvance && note.advanceValue != null ? new Decimal(note.advanceValue) : new Decimal(0);

  return {
    controlNumber: note.controlNumber,
    publicRef: note.publicRef,
    qrUrl: options.qrUrl ?? null,
    customerName: note.customerName,
    contactNumber: note.contactNumber ?? null,
    brand: note.brand,
    model: note.model,
    reportedFailure: note.reportedFailure,
    additionalFindings: note.additionalFindings ?? null,
    totalValue: moneyString(total),
    requiresAdvance: note.requiresAdvance,
    advanceValue: note.advanceValue != null ? moneyString(note.advanceValue) : null,
    balance: moneyString(total.minus(advance)),
    receivedAt: note.receivedAt,
    deliveryDate: note.deliveryDate ?? null,
    assignedEmployeeName: options.assignedEmployeeName ?? null,
    technicianNotes: note.technicianNotes ?? null,
    serviceTypeNames: options.serviceTypeNames ?? [],
    deviceOff: note.deviceOff,
    hasWarranty: note.hasWarranty,
    hasExtendedWarranty: note.hasExtendedWarranty,
    extendedWarrantyDays: note.extendedWarrantyDays ?? null,
    local: toPdfLocal(local),
    palette: paletteOf(local),
  };
}
