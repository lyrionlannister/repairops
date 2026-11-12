import { Router } from "express";
import { SaleController } from "../controllers/sale.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requireRole } from "../../../identity/auth/middlewares/require-role.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

// Toda venta exige una sesión de caja abierta (SaleService.create), y solo
// quien puede operar la caja puede cobrar -- mismo módulo que cash.routes.ts.
const canSell = requireRole("owner", "admin", "cashier");

export const createSaleRouter = (controller: SaleController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/", controller.getAll);
  router.get("/:id", controller.getById);
  router.post("/", canSell, controller.create);
  return router;
};
