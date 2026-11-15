import { Router } from "express";
import { CashController } from "../controllers/cash.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requireRole } from "../../../identity/auth/middlewares/require-role.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

// Modulo Caja: un tecnico no abre/cierra sesion ni registra movimientos, ni
// por pantalla ni por API (criterio de aceptacion de la Fase 1). Lectura
// queda abierta a cualquier rol autenticado.
const canWriteCash = requireRole("owner", "admin", "cashier");

export const createCashRouter = (controller: CashController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);

  router.get("/sessions", controller.getAllSessions);
  router.get("/sessions/open", controller.getOpenSession);
  router.get("/sessions/:id", controller.getSessionById);
  router.post("/sessions", canWriteCash, controller.openSession);
  router.post("/sessions/:id/close", canWriteCash, controller.closeSession);
  router.get("/sessions/:id/movements", controller.getMovements);
  router.post("/sessions/:id/movements", canWriteCash, controller.registerMovement);
  router.get("/sessions/:id/summary", controller.getSummary);

  return router;
};
