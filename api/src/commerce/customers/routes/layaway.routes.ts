import { Router } from "express";
import { LayawayController } from "../controllers/layaway.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requireRole } from "../../../identity/auth/middlewares/require-role.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

// Mismo rol que vende/devuelve -- un apartado mueve dinero y stock igual
// que una venta.
const canSell = requireRole("owner", "admin", "cashier");

export const createLayawayRouter = (controller: LayawayController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/", controller.getAll);
  router.get("/:id", controller.getById);
  router.post("/", canSell, controller.open);
  router.post("/:id/complete", canSell, controller.complete);
  router.post("/:id/cancel", canSell, controller.cancel);
  return router;
};
