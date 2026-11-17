import { Router } from "express";
import { LocalController } from "../controllers/local.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requireRole } from "../../../identity/auth/middlewares/require-role.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

export const createLocalRouter = (controller: LocalController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/", controller.get);
  // Cambiar la configuracion del local es solo del owner; leerla (folios, moneda, color) la necesita todo el personal.
  router.patch("/", requireRole("owner"), controller.update);
  return router;
};
