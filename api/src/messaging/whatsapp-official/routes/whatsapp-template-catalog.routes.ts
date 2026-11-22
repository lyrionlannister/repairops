import { Router } from "express";
import { WhatsappTemplateCatalogController } from "../controllers/whatsapp-template-catalog.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission, requirePlatformPermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";


export const createWhatsappTemplateCatalogRouter = (
  controller: WhatsappTemplateCatalogController,
): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);

  // Sistema primero -- platform.templates.manage, nada de tenant de por medio
  // (ver Boundary de Checkpoint 7: sin WhatsappAccount de sistema todavia).
  router.get("/system", requirePlatformPermission("platform.templates.manage"), controller.listSystem);
  router.post("/system", requirePlatformPermission("platform.templates.manage"), controller.createSystem);
  router.patch("/system/:id", requirePlatformPermission("platform.templates.manage"), controller.updateSystem);
  router.delete("/system/:id", requirePlatformPermission("platform.templates.manage"), controller.removeSystem);

  router.get("/", requirePermission("whatsapp.read"), controller.list);
  router.post("/", requirePermission("whatsapp.manage"), controller.create);
  router.patch("/:id", requirePermission("whatsapp.manage"), controller.update);
  router.delete("/:id", requirePermission("whatsapp.manage"), controller.remove);

  return router;
};
