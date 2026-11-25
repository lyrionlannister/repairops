export interface RepairNoteDevice {
  brand: string;
  model: string;
  reportedFailure: string;
  deviceOff: boolean;
  serviceTypeIds: string[];
}

export interface RepairNoteRecord {
  id: string;
  controlNumber: number;
  publicRef: string;
  // URL wa.me del QR impreso; la arma el API. null si el taller no tiene numero de WhatsApp.
  whatsappQrUrl?: string | null;
  customerName: string;
  contactNumber?: string;
  devices: RepairNoteDevice[];
  totalValue: number;
  status: RepairNoteStatus;
  requiresAdvance: boolean;
  advanceValue?: number;
  receivedAt: string;
  receivedTime: string;
  deliveryDate?: string;
  technicianNotes?: string;
  additionalFindings?: string;
  assignedEmployeeId?: string | null;
  localId?: string | null;
  customerId?: string | null;
  hasWarranty: boolean;
  hasExtendedWarranty: boolean;
  extendedWarrantyDays?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RepairNoteFormData {
  customerName: string;
  contactNumber: string;
  devices: RepairNoteDevice[];
  totalValue: string;
  status: RepairNoteStatus;
  requiresAdvance: boolean;
  advanceValue: string;
  receivedAt: string;
  deliveryDate: string;
  technicianNotes: string;
  additionalFindings: string;
  assignedEmployeeId: string;
  localId: string;
  customerId: string;
  hasWarranty: boolean;
  hasExtendedWarranty: boolean;
  extendedWarrantyDays: string;
}

export interface AdvancePaymentInput {
  method: "efectivo" | "tarjeta" | "transferencia";
  createdByEmployeeId: string;
}

export interface RepairNoteItemInput {
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
}

export interface RepairNoteItemRecord extends RepairNoteItemInput {
  id: string;
  itemName?: string | null;
}

export type RepairNoteStatus = "received" | "in_repair" | "done" | "delivered" | "cancelled";

export type RepairNoteStatusFilter = RepairNoteStatus | "all" | "open";
