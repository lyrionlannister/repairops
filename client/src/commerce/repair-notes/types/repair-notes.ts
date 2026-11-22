export interface RepairNoteRecord {
  id: string;
  controlNumber: number;
  publicRef: string;
  // URL wa.me del QR impreso; la arma el API. null si el taller no tiene numero de WhatsApp.
  whatsappQrUrl?: string | null;
  customerName: string;
  contactNumber?: string;
  brand: string;
  model: string;
  reportedFailure: string;
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
  deviceOff: boolean;
  hasWarranty: boolean;
  hasExtendedWarranty: boolean;
  extendedWarrantyDays?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RepairNoteFormData {
  customerName: string;
  contactNumber: string;
  brand: string;
  model: string;
  reportedFailure: string;
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
  serviceTypeIds: string[];
  deviceOff: boolean;
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
}

export type RepairNoteStatus = "received" | "in_repair" | "done" | "delivered" | "cancelled";
