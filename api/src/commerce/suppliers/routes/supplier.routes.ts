import { Router } from "express";
import { SupplierController } from "../controllers/supplier.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";
import { publicIdParam } from "../../../core/http/public-id/public-id-request.js";

export const createSupplierRouter = (controller: SupplierController): Router => {
  const router = Router();
  router.param("id", publicIdParam("proveedores"));
  router.use(authMiddleware, tenantMiddleware);
  router.get("/", requirePermission("suppliers.read"), controller.getAll);
  router.get("/:id", requirePermission("suppliers.read"), controller.getById);
  router.post("/", requirePermission("suppliers.manage"), controller.create);
  router.patch("/:id", requirePermission("suppliers.manage"), controller.update);
  router.patch("/:id/active", requirePermission("suppliers.manage"), controller.setActive);
  router.delete("/:id", requirePermission("suppliers.manage"), controller.delete);
  return router;
};
