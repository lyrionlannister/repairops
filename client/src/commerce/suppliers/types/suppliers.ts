export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  contactName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  contactName: string;
}

export type SupplierPayload = Pick<
  Supplier,
  "name" | "phone" | "email" | "address" | "contactName"
>;
