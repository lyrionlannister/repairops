export interface QuoteRecord {
  id: string;
  quoteNumber: number;
  localId: string;
  kind: QuoteKind;
  customerId: string | null;
  customerName: string;
  contactNumber: string | null;
  brand: string | null;
  model: string | null;
  reportedFailure: string | null;
  repairNoteId: string | null;
  totalValue: number;
  validUntil: string | null;
  status: QuoteStatus;
  createdByEmployeeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteItemInput {
  inventoryItemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface QuoteItemRecord extends QuoteItemInput {
  id: string;
}

export interface QuoteFormData {
  localId: string;
  kind: QuoteKind;
  customerId: string;
  customerName: string;
  contactNumber: string;
  brand: string;
  model: string;
  reportedFailure: string;
  serviceTypeIds: string[];
  validUntil: string;
  createdByEmployeeId: string;
}

export type QuoteStatus = "pending" | "accepted" | "rejected";

export type QuoteKind = "product" | "repair";
