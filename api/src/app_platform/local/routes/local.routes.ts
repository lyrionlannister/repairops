import { Router } from "express";
import { LocalController } from "../controllers/local.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

export const createLocalRouter = (controller: LocalController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/", requirePermission("branches.read"), controller.get);
  // Cambiar la configuracion del local es solo del owner; leerla (folios, moneda, color) la necesita todo el personal.
  router.patch("/", requirePermission("local.manage"), controller.update);
  return router;
};
