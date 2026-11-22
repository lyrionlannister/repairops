import type { UserRole } from "@common/types/auth/permission";

export interface DiscountCap {
  role: CappedRole;
  maxDiscountPercent: string;
}

export type CappedRole = Exclude<UserRole, "owner">;

export type DiscountCapForm = Record<CappedRole, string>;
