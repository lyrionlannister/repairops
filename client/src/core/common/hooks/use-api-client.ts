import { useCallback, useMemo } from "react";
import { useToast } from "./use-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const sendRequest = async (url: string, options: RequestInit = {}) => {
  return await fetch(url, options);
};

// Endpoints donde el toast generico sobra: auth tiene su propio mensaje inline
// y chats/notificaciones son acciones de alta frecuencia.
const SILENT_PREFIXES = ["/auth/login", "/auth/logout", "/auth/register", "/chats", "/notifications"];

const SUCCESS_TITLE: Record<string, string> = {
  POST: "Creado correctamente",
  PUT: "Cambios guardados",
  PATCH: "Cambios guardados",
  DELETE: "Eliminado correctamente",
};

export const useApiClient = () => {
  const { showToast } = useToast();

  const apiClient = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      if (!endpoint.startsWith("/")) {
        throw new Error("Endpoint must start with a slash (/)");
      }

      if (!API_BASE_URL || typeof API_BASE_URL !== "string") {
        throw new Error(
          "VITE_API_BASE_URL no esta configurada. Define esta variable en el entorno del client.",
        );
      }

      const url = `${API_BASE_URL}${endpoint}`;
      const method = (options.method ?? "GET").toUpperCase();
      const isMutation = method in SUCCESS_TITLE;
      const notify = isMutation && !SILENT_PREFIXES.some((prefix) => endpoint.startsWith(prefix));

      // La sesion viaja en una cookie httpOnly (nunca legible por JS, ver
      // OWASP Session Management Cheat Sheet): no hay header Authorization
      // que armar, solo pedirle al navegador que la mande.
      let response: Response;
      try {
        response = await sendRequest(url, { ...options, credentials: "include" });
      } catch (error) {
        if (notify) showToast({ title: "Sin conexión", message: "No se pudo contactar al servidor.", variant: "error" });
        throw error;
      }

      if (notify) {
        if (response.ok) {
          showToast({ title: SUCCESS_TITLE[method], variant: "success" });
        } else if (response.status !== 401) {
          const body = await response.clone().json().catch(() => ({}));
          showToast({
            title: "No se pudo completar la acción",
            message: (body as { error?: string }).error ?? `Error ${response.status}`,
            variant: "error",
          });
        }
      }

      return response;
    },
    [showToast],
  );

  return useMemo(() => ({ apiClient }), [apiClient]);
};
