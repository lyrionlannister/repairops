import type { CurrentUser } from "../types/current-user";

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
