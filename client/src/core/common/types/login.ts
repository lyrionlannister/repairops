import type { Permission, UserRole } from "./auth/permission";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: {
    id: string;
    tenantId: string;
    roles: UserRole[];
    permissions: Permission[];
    isPlatformAdmin: boolean;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
}
