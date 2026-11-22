import type { Permission, UserRole } from "../types/auth/permission";

export type CurrentUserRole = UserRole;

export interface CurrentUser {
  id: string;
  roles: CurrentUserRole[];
  permissions: Permission[];
  firstName: string;
  lastName: string;
  email: string;
  isPlatformAdmin: boolean;
}

// Lee el usuario que use-login.ts guarda en sessionStorage al iniciar sesión y que
// useAuthGuard refresca desde /users/me al montar el shell -- no hace una llamada
// nueva a la API. Solo para decisiones de UI; la API es la que de verdad autoriza.
export const useCurrentUser = (): CurrentUser | null => {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
};
