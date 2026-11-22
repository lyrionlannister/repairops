import { Router } from "express";
import { WhatsappAccountController } from "../controllers/whatsapp-account.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";


export const createWhatsappAccountRouter = (controller: WhatsappAccountController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/status", requirePermission("whatsapp.read"), controller.getStatus);
  router.post("/account", requirePermission("whatsapp.manage"), controller.connectAccount);
  router.get("/templates", requirePermission("whatsapp.read"), controller.getTemplates);
  return router;
};
