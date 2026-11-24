import type { Permission, UserRole } from "@common/types/auth/permission";

export interface Me {
  id: string;
  tenantId: string;
  roles: UserRole[];
  permissions: Permission[];
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  isPlatformAdmin: boolean;
  salaryAmount: number | null;
  payCycle: "weekly" | "biweekly" | "monthly" | null;
  subscriptionStatus: "incomplete" | "trialing" | "active" | "past_due" | "canceled";
  emailVerifiedAt: string | null;
}
