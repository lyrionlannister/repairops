import rateLimit from "express-rate-limit";
import { optionalEnvNumber } from "../config/env.js";

// Límites por IP. La API vive detrás de un solo nginx (ver index.ts:
// trust proxy 1), así que req.ip es la IP real del cliente.
const TOO_MANY_REQUESTS = "Demasiadas peticiones, intenta de nuevo más tarde.";
const TOO_MANY_ATTEMPTS = "Demasiados intentos, intenta de nuevo más tarde.";

// Global: abuso general (fuerza bruta sobre rutas con JWT, scrapers).
// Los webhooks de Stripe/Meta no pasan por JWT y llegan desde pocas IPs:
// limitarlos rompería cobros y mensajes entrantes.
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: optionalEnvNumber("RATE_LIMIT_GLOBAL_MAX", 1000),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: TOO_MANY_REQUESTS },
  skip: (req) =>
    req.path === "/api/v1/billing/webhook" || req.path === "/api/v1/whatsapp-official/webhook",
});

// Login: 10 intentos por IP cada 15 minutos.
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: optionalEnvNumber("RATE_LIMIT_LOGIN_MAX", 10),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: TOO_MANY_ATTEMPTS },
});

// Registro: 5 intentos por IP cada hora.
export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: optionalEnvNumber("RATE_LIMIT_REGISTER_MAX", 5),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: TOO_MANY_ATTEMPTS },
});

// Refresh: 30 por IP cada 15 minutos (varias pestañas pueden refrescar a la vez).
export const refreshRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: optionalEnvNumber("RATE_LIMIT_REFRESH_MAX", 30),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: TOO_MANY_REQUESTS },
});
