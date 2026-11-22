import { type UserRole } from "../hooks/use-users";

export interface RoleCheckboxesProps {
  roles: UserRole[];
  disabled: boolean;
  onChange: (roles: UserRole[]) => void;
}
