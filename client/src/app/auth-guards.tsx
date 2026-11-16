import { Navigate } from "react-router";
import type { ReactNode } from "react";

// La sesion real vive en una cookie httpOnly (no legible por JS). Esto es
// solo una senal optimista para el ruteo del cliente -- quien de verdad
// autoriza cada request es la API; useAuthGuard valida contra /auth/users/me
// y cierra la sesion si la cookie ya no es valida.
export const isAuthenticated = (): boolean => {
  return Boolean(sessionStorage.getItem("user"));
};

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/identity/sign-in" replace />;
  }

  return <>{children}</>;
};

export const LoginOnlyWhenLoggedOut = ({
  children,
}: {
  children: ReactNode;
}) => {
  if (isAuthenticated()) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};
