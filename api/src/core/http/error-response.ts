import type { Response } from "express";
import { QueryFailedError } from "typeorm";
import { BranchAccessError } from "../tenancy/tenant-context.js";
import { ForbiddenError } from "../../identity/authz/access.js";
import { PlanLimitReachedError } from "../../app_platform/billing/errors/plan-limit-reached.error.js";

const GENERIC_MESSAGE = "Ocurrió un error inesperado. Intenta de nuevo.";

// Códigos SQLSTATE de Postgres que un Service puede dejar escapar sin
// validar antes (FK/unicidad/CHECK) -- el texto real del driver (con nombres
// de tabla y constraint) nunca llega al cliente, solo queda en el log.
const PG_ERROR_MAP: Record<string, { status: number; message: string }> = {
  "23503": { status: 409, message: "No se puede completar la operación: hay información relacionada que lo impide." },
  "23505": { status: 409, message: "Ya existe un registro con esos datos." },
  "23514": { status: 400, message: "Los datos no cumplen una regla de validación." },
};

// Único lugar donde un controlador traduce un error atrapado a una
// respuesta HTTP: conserva el mensaje de negocio ya escrito para el usuario
// (un `throw new Error("mensaje")` de un Service), convierte cualquier
// error de Postgres en un mensaje genérico sin nombres de tabla ni de
// constraint, y registra el error real en consola para diagnóstico -- el
// usuario nunca ve el texto crudo del driver.
export function sendError(res: Response, error: unknown, fallbackStatus: number, fallbackMessage = GENERIC_MESSAGE): void {
  if (error instanceof BranchAccessError || error instanceof ForbiddenError) {
    res.status(403).json({ error: error.message });
    return;
  }

  // Código fijo para que el client ofrezca cambiar de plan en vez de un error genérico.
  if (error instanceof PlanLimitReachedError) {
    res.status(402).json({ error: error.message, code: error.code, resource: error.resource, limit: error.limit, used: error.used });
    return;
  }

  if (error instanceof QueryFailedError) {
    const code = (error as { code?: string }).code;
    const mapped = (code ? PG_ERROR_MAP[code] : undefined) ?? { status: 500, message: GENERIC_MESSAGE };
    console.error("[db] Error de base de datos:", code, error.message);
    res.status(mapped.status).json({ error: mapped.message });
    return;
  }

  if (error instanceof Error && error.message) {
    res.status(fallbackStatus).json({ error: error.message });
    return;
  }

  console.error("Error inesperado:", error);
  res.status(fallbackStatus).json({ error: fallbackMessage });
}

export const queryString = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);
