export type CurrentUserRole = "owner" | "admin" | "employee" | "technician" | "cashier";

export interface CurrentUser {
  id: string;
  role: CurrentUserRole;
  firstName: string;
  lastName: string;
  email: string;
}

// Lee el usuario que use-login.ts ya guarda en sessionStorage al iniciar
// sesión -- no hace una llamada nueva a la API. Solo para decisiones de UI
// (ocultar un botón/ítem de menú); la API es la que de verdad autoriza.
export const useCurrentUser = (): CurrentUser | null => {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
};
