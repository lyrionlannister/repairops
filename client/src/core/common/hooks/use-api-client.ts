import { useCallback, useMemo } from "react";
import { useToast } from "./use-toast";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const sendRequest = async (url: string, options: RequestInit = {}) => {
  return await fetch(url, options);
};

// Todo mensaje de la API se muestra como toast (exito en mutaciones, error en
// cualquier metodo). Excepciones: chats/notificaciones son alta frecuencia o
// polling, y logout redirige solo, asi que unicamente avisa errores.
const SILENT_PREFIXES = ["/chats", "/notifications"];
const SILENT_SUCCESS_PREFIXES = ["/auth/logout"];

const SUCCESS_TITLE: Record<string, string> = {
  POST: "Creado correctamente",
  PUT: "Cambios guardados",
  PATCH: "Cambios guardados",
  DELETE: "Eliminado correctamente",
};

const SPECIFIC_TITLE: Array<[RegExp, string]> = [
  [/^\/auth\/login/, "Sesión iniciada"],
  [/^\/auth\/register/, "Registro completado"],
  [/^\/cash\/sessions\/[^/]+\/close/, "Caja cerrada"],
  [/^\/cash\/sessions(\?|$)/, "Caja abierta"],
  [/^\/inventory\/counts\/[^/]+\/close/, "Conteo cerrado"],
  [/^\/inventory\/counts(\?|$)/, "Conteo abierto"],
  [/^\/inventory\/transfers/, "Transferencia registrada"],
  [/^\/layaways\/[^/]+\/complete/, "Apartado completado"],
  [/^\/layaways\/[^/]+\/cancel/, "Apartado cancelado"],
  [/^\/repair-notes\/[^/]+\/cancel/, "Nota cancelada"],
  [/^\/sales(\?|$)/, "Venta registrada"],
  [/^\/returns(\?|$)/, "Devolución registrada"],
  [/^\/import-staging\/[^/]+\/commit/, "Importación confirmada"],
];

// Varias peticiones de una misma pantalla pueden fallar a la vez (API caida,
// por ejemplo): el mismo toast no se repite dentro de la ventana.
const DEDUPE_WINDOW_MS = 4000;
let lastToastKey = "";
let lastToastAt = 0;

export const useApiClient = () => {
  const { showToast: rawShowToast } = useToast();
  const showToast = useCallback(
    (toast: Parameters<typeof rawShowToast>[0]) => {
      const key = `${toast.variant}|${toast.title}|${toast.message ?? ""}`;
      const now = Date.now();
      if (key === lastToastKey && now - lastToastAt < DEDUPE_WINDOW_MS) return;
      lastToastKey = key;
      lastToastAt = now;
      rawShowToast(toast);
    },
    [rawShowToast],
  );

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
      const notify = !SILENT_PREFIXES.some((prefix) => endpoint.startsWith(prefix));
      const notifySuccess =
        isMutation && !SILENT_SUCCESS_PREFIXES.some((prefix) => endpoint.startsWith(prefix));

      // La sesion viaja en una cookie httpOnly (nunca legible por JS, ver
      // OWASP Session Management Cheat Sheet): no hay header Authorization
      // que armar, solo pedirle al navegador que la mande.
      let response: Response;
      try {
        response = await sendRequest(url, { ...options, credentials: "include" });
      } catch (error) {
        if (notify)
          showToast({
            title: "Sin conexión",
            message: "No se pudo contactar al servidor.",
            variant: "error",
          });
        throw error;
      }

      if (notify) {
        if (response.ok) {
          if (notifySuccess)
            showToast({
              title: SPECIFIC_TITLE.find(([re]) => re.test(endpoint))?.[1] ?? SUCCESS_TITLE[method],
              variant: "success",
            });
        } else if (response.status !== 401 || endpoint.startsWith("/auth/login")) {
          // 401 en otras rutas = sesion vencida (el guard redirige), no un mensaje.
          const body = await response
            .clone()
            .json()
            .catch(() => ({}));
          showToast({
            title: "No se pudo completar la acción",
            message: String((body as { error?: unknown }).error ?? `Error ${response.status}`),
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
