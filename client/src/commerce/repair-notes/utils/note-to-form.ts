import type { RepairNoteFormData, RepairNoteRecord, RepairNoteStatus } from "../types/repair-notes";
import { EMPTY_DEVICE } from "./devices";
export const noteToForm = (n: RepairNoteRecord): RepairNoteFormData => ({
  customerName: n.customerName,
  contactNumber: n.contactNumber ?? "",
  devices: n.devices.length > 0 ? n.devices.map((d) => ({ ...d, serviceTypeIds: [...(d.serviceTypeIds ?? [])] })) : [{ ...EMPTY_DEVICE }],
  totalValue: String(n.totalValue),
  status: n.status as RepairNoteStatus,
  requiresAdvance: n.requiresAdvance,
  advanceValue: n.advanceValue != null ? String(n.advanceValue) : "",
  receivedAt: n.receivedAt,
  deliveryDate: n.deliveryDate ?? "",
  technicianNotes: n.technicianNotes ?? "",
  additionalFindings: n.additionalFindings ?? "",
  assignedEmployeeId: n.assignedEmployeeId ?? "",
  localId: n.localId ?? "",
  customerId: n.customerId ?? "",
  hasWarranty: n.hasWarranty,
  hasExtendedWarranty: n.hasExtendedWarranty,
  extendedWarrantyDays: n.extendedWarrantyDays != null ? String(n.extendedWarrantyDays) : "",
});
