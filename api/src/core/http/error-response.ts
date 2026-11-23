import type { Response } from "express";
import { QueryFailedError } from "typeorm";
import Stripe from "stripe";
import { BranchAccessError } from "../tenancy/tenant-context.js";
import { ForbiddenError } from "../../identity/authz/access.js";
import { PlanLimitReachedError } from "../../app_platform/billing/errors/plan-limit-reached.error.js";
import { BusinessError } from "./business-error.js";
import { WhatsappGraphApiError } from "../../messaging/whatsapp-official/clients/whatsapp-graph.client.js";
import { UserRoleRuleError } from "../../identity/auth/services/auth.service.js";

const GENERIC_MESSAGE = "Ocurrió un error inesperado. Intenta de nuevo.";

// Códigos SQLSTATE de Postgres que un Service puede dejar escapar sin
// validar antes (FK/unicidad/CHECK) -- el texto real del driver (con nombres
// de tabla y constraint) nunca llega al cliente, solo queda en el log.
const PG_ERROR_MAP: Record<string, { status: number; message: string }> = {
  "23503": {
    status: 409,
    message: "No se puede completar la operación: hay información relacionada que lo impide.",
  },
  "23505": { status: 409, message: "Ya existe un registro con esos datos." },
  "23514": { status: 400, message: "Los datos no cumplen una regla de validación." },
};

// Único lugar donde un controlador traduce un error atrapado a una
// respuesta HTTP. Solo los errores de negocio llegan al cliente con su
// mensaje: BusinessError (mensaje escrito para el usuario), los de acceso
// (403), el de límite de plan (402) y los de reglas de roles. Cualquier
// otro error -- Stripe, TypeORM, o un `Error` plano con un mensaje interno
// -- se registra en consola y se responde con un mensaje genérico, sin
// filtrar jamás el `error.message` original.
export function sendError(
  res: Response,
  error: unknown,
  fallbackStatus: number,
  fallbackMessage = GENERIC_MESSAGE,
): void {
  if (error instanceof BranchAccessError || error instanceof ForbiddenError) {
    res.status(403).json({ error: error.message });
    return;
  }

  // Código fijo para que el client ofrezca cambiar de plan en vez de un error genérico.
  if (error instanceof PlanLimitReachedError) {
    res.status(402).json({
      error: error.message,
      code: error.code,
      resource: error.resource,
      limit: error.limit,
      used: error.used,
    });
    return;
  }

  // Errores de reglas de roles (p.ej. "Elige al menos un rol"): mensajes de
  // negocio escritos para el usuario.
  if (error instanceof UserRoleRuleError) {
    res.status(fallbackStatus).json({ error: error.message });
    return;
  }

  if (error instanceof QueryFailedError) {
    const code = (error as { code?: string }).code;
    const mapped = (code ? PG_ERROR_MAP[code] : undefined) ?? {
      status: 500,
      message: GENERIC_MESSAGE,
    };
    console.error("[db] Error de base de datos:", code, error.message);
    res.status(mapped.status).json({ error: mapped.message });
    return;
  }

  // Errores del SDK de Stripe (p.ej. "No such customer"): su mensaje trae
  // identificadores internos y nunca debe llegar al cliente.
  if (error instanceof Stripe.errors.StripeError) {
    console.error("[stripe] Error de Stripe:", error.type, error.message);
    res.status(502).json({ error: "No se pudo completar la operación con el proveedor de pagos." });
    return;
  }

  // Errores de la Graph API de Meta (p.ej. token inválido, plantilla
  // rechazada): su mensaje es la validación que Meta devuelve sobre los
  // datos del propio usuario (sus credenciales, su plantilla) y los
  // controladores de WhatsApp lo muestran a propósito para que el usuario
  // lo corrija. No es un detalle interno del servidor: el `body` crudo
  // de Meta nunca se serializa. El status es el del controlador (400).
  if (error instanceof WhatsappGraphApiError) {
    console.error("[whatsapp] Error de la Graph API de Meta:", error.status, error.message);
    res.status(fallbackStatus).json({ error: error.message });
    return;
  }

  // Mensaje de negocio explícito: el único `Error` plano cuyo texto se muestra.
  if (error instanceof BusinessError) {
    res.status(error.status ?? fallbackStatus).json({ error: error.message });
    return;
  }

  console.error("Error inesperado:", error);
  res.status(fallbackStatus).json({ error: fallbackMessage });
}

export const queryString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;
