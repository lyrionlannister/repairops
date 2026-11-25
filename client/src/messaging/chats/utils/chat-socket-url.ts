import { API_BASE_URL } from "../../../core/common/hooks/use-api-client";

// El socket vive en el mismo host/puerto que la API REST (API_BASE_URL trae
// el prefijo /api/v1, que el socket no usa) -- solo cambia el protocolo. En
// produccion VITE_API_BASE_URL es relativa ("/api/v1", ver client/.env.production):
// `new URL` sin base revienta con una relativa, por eso resuelve contra
// window.location.origin (no toca nada si ya es absoluta).
export function chatSocketUrl(): string | null {
  if (!API_BASE_URL) return null;
  const url = new URL(API_BASE_URL, window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/chats";
  url.search = "";
  return url.toString();
}
