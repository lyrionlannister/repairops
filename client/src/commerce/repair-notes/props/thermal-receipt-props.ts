import type { RepairNoteRecord } from "../types/repair-notes";
import type { LocalRecord } from "../../../app_platform/local/types/local";

export interface ThermalReceiptProps {
  note: RepairNoteRecord;
  local: LocalRecord | null;
  serviceTypeNames: string[];
  widthMm: 58 | 80;
}
