import type { UserRole } from "../types/auth/permission";

export interface EmployeeSelectProps {
  value: string;
  onChange: (employeeId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  roles?: UserRole[];
}
