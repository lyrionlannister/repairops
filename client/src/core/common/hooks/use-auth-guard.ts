import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useApiClient } from "./use-api-client";

// No basta con mirar sessionStorage: la cookie httpOnly puede seguir ahi
// pero ya no corresponder a nada (usuario borrado, tenant eliminado, DB
// restaurada) y seguiriamos mostrando la app como si hubiera sesion. Por
// eso esto valida contra la API en cada guard, no solo contra el storage
// local.
export const useAuthGuard = (redirectTo: string = "/app/sign-in") => {
  const navigate = useNavigate();
  const { apiClient } = useApiClient();

  useEffect(() => {
    if (!sessionStorage.getItem("user")) {
      sessionStorage.clear();
      navigate(redirectTo, { replace: true });
      return;
    }

    apiClient("/auth/users/me")
      .then((res) => {
        if (!res.ok) {
          sessionStorage.clear();
          navigate(redirectTo, { replace: true });
        }
      })
      .catch(() => {
        // Error de red: no se puede confirmar ni descartar la sesion, se
        // deja la navegacion optimista como esta en vez de desloguear.
      });
  }, [apiClient, navigate, redirectTo]);
};
