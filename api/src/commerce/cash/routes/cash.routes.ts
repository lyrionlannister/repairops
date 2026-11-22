import { Router } from "express";
import { CashController } from "../controllers/cash.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";


export const createCashRouter = (controller: CashController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);

  router.get("/sessions", requirePermission("cash.read"), controller.getAllSessions);
  router.get("/sessions/open", requirePermission("cash.read"), controller.getOpenSession);
  router.get("/sessions/:id", requirePermission("cash.read"), controller.getSessionById);
  router.post("/sessions", requirePermission("cash.operate"), controller.openSession);
  router.post("/sessions/:id/close", requirePermission("cash.operate"), controller.closeSession);
  router.get("/sessions/:id/movements", requirePermission("cash.read"), controller.getMovements);
  router.post("/sessions/:id/movements", requirePermission("cash.operate"), controller.registerMovement);
  router.get("/sessions/:id/summary", requirePermission("cash.read"), controller.getSummary);

  return router;
};
