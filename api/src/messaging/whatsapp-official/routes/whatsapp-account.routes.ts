import { Router } from "express";
import { WhatsappAccountController } from "../controllers/whatsapp-account.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requireRole } from "../../../identity/auth/middlewares/require-role.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

// Conectar la cuenta de WhatsApp del taller es tan sensible como abrir/cerrar
// caja -- mismo criterio que canWriteCash (ver plan Fase 4, Checkpoint 6).
const canConnectAccount = requireRole("owner");

export const createWhatsappAccountRouter = (controller: WhatsappAccountController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/status", controller.getStatus);
  router.post("/account", canConnectAccount, controller.connectAccount);
  router.get("/templates", controller.getTemplates);
  return router;
};
