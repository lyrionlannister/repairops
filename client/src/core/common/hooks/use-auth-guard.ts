import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useApiClient } from "./use-api-client";

// No basta con mirar sessionStorage: la cookie httpOnly puede seguir ahi
// pero ya no corresponder a nada (usuario borrado, tenant eliminado, DB
// restaurada) y seguiriamos mostrando la app como si hubiera sesion. Por
// eso esto valida contra la API en cada guard, no solo contra el storage
// local. La misma respuesta refresca roles y permisos guardados: un cambio que haga
// el dueño se ve al recargar, sin cerrar sesión.
export const useAuthGuard = (redirectTo: string = "/identity/sign-in") => {
  const navigate = useNavigate();
  const { apiClient } = useApiClient();
  const [, setRefreshed] = useState(0);

  useEffect(() => {
    if (!sessionStorage.getItem("user")) {
      sessionStorage.clear();
      navigate(redirectTo, { replace: true });
      return;
    }

    apiClient("/auth/users/me")
      .then(async (res) => {
        if (!res.ok) {
          sessionStorage.clear();
          navigate(redirectTo, { replace: true });
          return;
        }
        const me = await res.json().catch(() => null);
        if (me) {
          sessionStorage.setItem("user", JSON.stringify(me));
          setRefreshed((n) => n + 1);
        }
      })
      .catch(() => {
        // Error de red: no se puede confirmar ni descartar la sesion, se
        // deja la navegacion optimista como esta en vez de desloguear.
      });
  }, [apiClient, navigate, redirectTo]);
};
