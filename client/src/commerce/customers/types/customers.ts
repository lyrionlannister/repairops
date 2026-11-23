export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  creditLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerCreditBalance {
  creditLimit: number;
  balance: number;
  available: number;
}

export interface CustomerDeviceHistoryEntry {
  brand: string;
  model: string;
  lastReceivedAt: string;
  controlNumber: number;
  notesCount: number;
}

export interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  creditLimit: string;
}
