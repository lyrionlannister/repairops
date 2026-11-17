import { useState } from "react";
import { useApiClient } from "./use-api-client";

export interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  message: string;
  user: {
    id: string;
    tenantId: string;
    role: "owner" | "employee" | "technician" | "cashier";
    isPlatformAdmin: boolean;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
}

export const useLogin = () => {
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

  const login = async (data: LoginPayload): Promise<LoginResponse | null> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await apiClient("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await safeReadJson<{ error?: string }>(response);
        throw new Error(errorData?.error || "Error al iniciar sesión");
      }

      const result = await safeReadJson<LoginResponse>(response);

      if (!result?.user) {
        throw new Error("Respuesta invalida del servidor al iniciar sesion");
      }

      // El token de sesion viaja en una cookie httpOnly (Set-Cookie de la
      // API) -- nunca llega aqui ni se guarda donde JS pueda leerlo. Esto
      // solo es el perfil para mostrar en la UI (nombre, rol para ocultar
      // menus), no la credencial.
      sessionStorage.setItem("user", JSON.stringify(result.user));

      setSuccess(true);
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error desconocido al iniciar sesión";
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  };

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(false);

  return {
    login,
    loading,
    error,
    success,
    clearError,
    clearSuccess,
  };
};
