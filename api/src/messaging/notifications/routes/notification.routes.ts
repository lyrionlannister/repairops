import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

export const createNotificationRouter = (controller: NotificationController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/", requirePermission("notifications.own"), controller.getAll);
  router.patch("/read-all", requirePermission("notifications.own"), controller.markAllRead);
  router.patch("/:id/read", requirePermission("notifications.own"), controller.markRead);
  return router;
};
