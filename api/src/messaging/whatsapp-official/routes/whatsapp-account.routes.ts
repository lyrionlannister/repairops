import { Router } from "express";
import { WhatsappAccountController } from "../controllers/whatsapp-account.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

export const createWhatsappAccountRouter = (controller: WhatsappAccountController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/status", controller.getStatus);
  router.get("/templates", controller.getTemplates);
  return router;
};
