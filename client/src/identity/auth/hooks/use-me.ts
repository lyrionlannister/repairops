import { useState, useCallback } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import type { Me } from "../types/me";

// Perfil del usuario autenticado, siempre fresco desde la fila real -- a
// diferencia del user guardado en sessionStorage al hacer login, que se
// queda con los datos de ese momento hasta el proximo login.
export const useMe = () => {
  const { apiClient } = useApiClient();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient("/auth/users/me");
      if (!res.ok) throw new Error("Error al obtener el perfil");
      setMe(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  return { me, loading, error, fetchMe };
};
