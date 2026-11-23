export type OverdueLevel = "none" | "low" | "medium" | "high";

export type CustomerCreditFilter = "all" | "pending" | "overdue";

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  creditLimit: number;
  creditBalance?: string;
  overdueBalance?: string;
  overdueLevel?: OverdueLevel;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerCreditBalance {
  creditLimit: number;
  balance: number;
  available: number;
}

export interface CustomerDeviceVisit {
  repairNoteId: string;
  controlNumber: number;
  receivedAt: string;
  status: string;
  reportedFailure: string;
  deviceOff: boolean;
  serviceTypeIds: string[];
  totalValue: string;
}

export interface CustomerDeviceHistoryEntry {
  brand: string;
  model: string;
  lastReceivedAt: string;
  controlNumber: number;
  notesCount: number;
  visits: CustomerDeviceVisit[];
}

export interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  creditLimit: string;
}
