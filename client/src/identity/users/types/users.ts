import type { UserRole } from "@common/types/auth/permission";

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles: UserRole[];
  salaryAmount: string;
  payCycle: PayCycle | "";
  branchIds: string[];
  primaryBranchId: string;
}

export interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: UserRole[];
  salaryAmount: number | null;
  payCycle: PayCycle | null;
  // Sucursales del usuario (vacío para el owner, que accede a todas).
  branchIds: string[];
  primaryBranchId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles: UserRole[];
  salaryAmount?: number;
  payCycle?: PayCycle;
  branchIds?: string[];
  primaryBranchId?: string;
}

export interface UpdateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  roles: UserRole[];
  salaryAmount?: number;
  payCycle?: PayCycle;
  branchIds?: string[];
  primaryBranchId?: string;
}

export type PayCycle = "weekly" | "biweekly" | "monthly";
