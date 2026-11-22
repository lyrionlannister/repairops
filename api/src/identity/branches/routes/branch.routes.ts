import { Router } from "express";
import { BranchController } from "../controllers/branch.controller.js";
import { authMiddleware } from "../../auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

export const createBranchRouter = (controller: BranchController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/", requirePermission("branches.read"), controller.getAll);
  router.get("/:id", requirePermission("branches.read"), controller.getById);
  router.post("/", requirePermission("branches.manage"), controller.create);
  router.patch("/:id", requirePermission("branches.manage"), controller.update);
  router.patch("/:id/active", requirePermission("branches.manage"), controller.setActive);
  router.get("/:id/discount-caps", requirePermission("branches.manage", "sales.create"), controller.getDiscountCaps);
  router.put("/:id/discount-caps", requirePermission("branches.manage"), controller.replaceDiscountCaps);
  return router;
};
