import { useState } from "react";
import { useApiClient } from "./use-api-client";
import type { RegisterPayload, RegisterResponse } from "../types/register";
import { apiErrorText } from "@common/utils/api-error";

export const useRegister = () => {
  const { apiClient } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const safeReadJson = async <T>(response: Response): Promise<T | null> => {
    const raw = await response.text();
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  };

  const register = async (data: RegisterPayload): Promise<RegisterResponse | null> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await apiClient("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await safeReadJson<{ error?: string }>(response);
        throw new Error(apiErrorText(errorData, "Error en el registro"));
      }

      const result = await safeReadJson<RegisterResponse>(response);
      if (!result?.user) {
        throw new Error("Respuesta invalida del servidor al registrar usuario");
      }

      // Auto-login: la API ya puso la cookie de sesión al registrar. Esto
      // solo marca "hay sesión" para el guard de rutas (ver auth-guards.tsx) --
      // el shell protegido la refresca completa (roles/permisos) desde
      // /auth/users/me al montar.
      sessionStorage.setItem("user", JSON.stringify(result.user));

      setSuccess(true);
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido en el registro";
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  };

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(false);

  return {
    register,
    loading,
    error,
    success,
    clearError,
    clearSuccess,
  };
};
