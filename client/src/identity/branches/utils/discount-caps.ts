import type { CappedRole, DiscountCap, DiscountCapForm } from "../hooks/use-discount-caps";

export const CAPPED_ROLES: CappedRole[] = ["cashier", "employee", "technician"];

export const capsToForm = (caps: DiscountCap[]): DiscountCapForm => {
  const form: DiscountCapForm = { cashier: "", employee: "", technician: "" };
  caps.forEach((cap) => {
    form[cap.role] = cap.maxDiscountPercent;
  });
  return form;
};

export const capsToPayload = (form: DiscountCapForm) =>
  CAPPED_ROLES.filter((role) => form[role].trim() !== "").map((role) => ({
    role,
    maxDiscountPercent: form[role].trim(),
  }));

