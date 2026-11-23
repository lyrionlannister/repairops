import { Router } from "express";
import { MessageTemplateController } from "../controllers/message-template.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";
import { publicIdParam } from "../../../core/http/public-id/public-id-request.js";

export const createMessageTemplateRouter = (controller: MessageTemplateController): Router => {
  const router = Router();
  router.param("id", publicIdParam("message_templates"));
  router.use(authMiddleware, tenantMiddleware);
  router.get("/", requirePermission("message-templates.read"), controller.getAll);
  router.get("/by-key/:key", requirePermission("message-templates.read"), controller.getByKey);
  router.post("/", requirePermission("message-templates.manage"), controller.create);
  router.patch("/:id", requirePermission("message-templates.manage"), controller.update);
  router.delete("/:id", requirePermission("message-templates.manage"), controller.delete);
  return router;
};
