import type { Permission, UserRole } from "./auth/permission";

export interface CurrentUser {
  id: string;
  roles: CurrentUserRole[];
  permissions: Permission[];
  firstName: string;
  lastName: string;
  email: string;
  isPlatformAdmin: boolean;
}

export type CurrentUserRole = UserRole;
