
export interface CustomerDebtRow {
  kind: "sale" | "repair_note";
  reference: number;
  date: string;
  amount: string;
}

export interface CustomerDebts {
  creditLimit: number;
  balance: number;
  available: number;
  items: CustomerDebtRow[];
}

export interface ProfileDraft {
  name: string;
  phone: string;
  email: string;
}
