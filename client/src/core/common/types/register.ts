import type { Me } from "../../../identity/auth/types/me";

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  // Igual que login: ya trae roles/permisos/subscriptionStatus, no un User a
  // secas -- evita el parpadeo de "Sin acceso" en /home mientras useAuthGuard
  // refresca desde /auth/users/me.
  user: Me;
}
