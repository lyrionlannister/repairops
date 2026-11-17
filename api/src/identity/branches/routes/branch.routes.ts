import { Router } from "express";
import { BranchController } from "../controllers/branch.controller.js";
import { authMiddleware } from "../../auth/middlewares/auth.middleware.js";
import { requireRole } from "../../auth/middlewares/require-role.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

export const createBranchRouter = (controller: BranchController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/", controller.getAll);
  router.get("/:id", controller.getById);
  // Crear, editar y desactivar sucursales es solo del owner.
  router.post("/", requireRole("owner"), controller.create);
  router.patch("/:id", requireRole("owner"), controller.update);
  router.patch("/:id/active", requireRole("owner"), controller.setActive);
  return router;
};
