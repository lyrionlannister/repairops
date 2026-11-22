import { Router } from "express";
import { SaleController } from "../controllers/sale.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";


export const createSaleRouter = (controller: SaleController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/", requirePermission("sales.read"), controller.getAll);
  router.get("/:id", requirePermission("sales.read"), controller.getById);
  router.post("/", requirePermission("sales.create"), controller.create);
  return router;
};
