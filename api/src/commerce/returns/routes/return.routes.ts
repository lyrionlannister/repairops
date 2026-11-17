import { Router } from "express";
import { ReturnController } from "../controllers/return.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requireRole } from "../../../identity/auth/middlewares/require-role.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

// Devolver dinero es tan sensible como cobrarlo -- mismo rol que puede
// cobrar (ver sale.routes.ts).
const canReturn = requireRole("owner", "cashier");

export const createReturnRouter = (controller: ReturnController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/by-sale/:saleId", controller.getBySaleId);
  router.get("/:id", controller.getById);
  router.post("/", canReturn, controller.create);
  return router;
};
