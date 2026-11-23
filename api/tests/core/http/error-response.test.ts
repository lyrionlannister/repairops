import type { Response } from "express";
import Stripe from "stripe";
import { QueryFailedError } from "typeorm";
import { describe, expect, it, vi } from "vitest";
import { sendError } from "../../../src/core/http/error-response.js";
import { BusinessError } from "../../../src/core/http/business-error.js";
import { ForbiddenError } from "../../../src/identity/authz/access.js";
import { WhatsappGraphApiError } from "../../../src/messaging/whatsapp-official/clients/whatsapp-graph.client.js";

// El handler global de errores nunca debe filtrar mensajes internos al
// cliente: solo los BusinessError (mensaje escrito para el usuario) y los
// errores de acceso/límite de plan conservan su texto. Todo lo demás --
// errores planos, Stripe y TypeORM -- sale con un mensaje genérico.
const makeRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
  return res;
};

describe("sendError", () => {
  it("preserves a BusinessError message with its own status", () => {
    const res = makeRes();
    sendError(res, new BusinessError("El registro está cerrado", 403), 400);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "El registro está cerrado" });
  });

  it("never leaks a plain Error message", () => {
    const res = makeRes();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    sendError(res, new Error("JWT secret is missing: use config.jwtSecret"), 400);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Ocurrió un error inesperado. Intenta de nuevo.",
    });
    spy.mockRestore();
  });

  it("maps a Stripe error to a generic 502 without its identifiers", () => {
    const res = makeRes();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const StripeErrorClass = new Stripe("sk_test_x").errors.StripeError;
    const stripeError = new StripeErrorClass({
      type: "invalid_request_error",
      message: "No such customer: 'cus_12345'",
    });
    sendError(res, stripeError, 400);
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({
      error: "No se pudo completar la operación con el proveedor de pagos.",
    });
    spy.mockRestore();
  });

  it("maps a Postgres unique-violation to a generic 409 without driver text", () => {
    const res = makeRes();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const dbError = new QueryFailedError(
      'INSERT INTO "users" ...',
      [],
      Object.assign(new Error('duplicate key value violates unique constraint "users_email_key"'), {
        code: "23505",
      }),
    );
    sendError(res, dbError, 400);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: "Ya existe un registro con esos datos." });
    spy.mockRestore();
  });

  it("returns a ForbiddenError message with 403", () => {
    const res = makeRes();
    sendError(res, new ForbiddenError("No tienes permiso para realizar esta acción."), 400);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "No tienes permiso para realizar esta acción.",
    });
  });

  // Excepción documentada: el mensaje de la Graph API de Meta sobre los
  // datos del propio usuario (credenciales, plantilla) sí se muestra, para
  // que el usuario lo corrija. El `body` crudo de Meta nunca se serializa.
  it("passes a Meta Graph API error message through with the controller status", () => {
    const res = makeRes();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    sendError(res, new WhatsappGraphApiError("Invalid OAuth access token", 401, {}), 400);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid OAuth access token" });
    spy.mockRestore();
  });
});
