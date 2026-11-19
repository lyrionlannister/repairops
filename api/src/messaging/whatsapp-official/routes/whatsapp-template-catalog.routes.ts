import { Router } from "express";
import { WhatsappTemplateCatalogController } from "../controllers/whatsapp-template-catalog.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requireRole } from "../../../identity/auth/middlewares/require-role.middleware.js";
import { requirePlatformAdmin } from "../../../identity/auth/middlewares/require-platform-admin.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

// Conectar/editar el catalogo de WhatsApp del taller es tan sensible como
// abrir/cerrar caja -- mismo criterio que canWriteCash/canConnectAccount
// (ver plan Fase 4, Checkpoint 7).
const canWriteCatalog = requireRole("owner");

export const createWhatsappTemplateCatalogRouter = (
  controller: WhatsappTemplateCatalogController,
): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);

  // Sistema primero -- requirePlatformAdmin, nada de tenant de por medio
  // (ver Boundary de Checkpoint 7: sin WhatsappAccount de sistema todavia).
  router.get("/system", requirePlatformAdmin, controller.listSystem);
  router.post("/system", requirePlatformAdmin, controller.createSystem);
  router.patch("/system/:id", requirePlatformAdmin, controller.updateSystem);
  router.delete("/system/:id", requirePlatformAdmin, controller.removeSystem);

  router.get("/", controller.list);
  router.post("/", canWriteCatalog, controller.create);
  router.patch("/:id", canWriteCatalog, controller.update);
  router.delete("/:id", canWriteCatalog, controller.remove);

  return router;
};
