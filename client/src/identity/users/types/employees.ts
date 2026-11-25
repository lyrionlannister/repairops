import type { UserRole } from "@common/types/auth/permission";

export interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: UserRole[];
}
