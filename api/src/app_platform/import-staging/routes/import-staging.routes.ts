import { Router } from "express";
import express from "express";
import { ImportStagingController } from "../controllers/import-staging.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";
import { requireInternalToken } from "../../../messaging/n8n/n8n-public.routes.js";

export const createImportStagingRouter = (controller: ImportStagingController): Router => {
  const router = Router();

  // Callback de n8n: sin JWT, gateado por el mismo secreto compartido que /api/v1/n8n/*.
  router.post("/callback", requireInternalToken, controller.callback);

  router.use(authMiddleware, tenantMiddleware);
  router.post("/upload", requirePermission("imports.run"), express.raw({ type: "*/*", limit: "20mb" }), controller.upload);
  router.get("/:importId", requirePermission("imports.run"), controller.getById);
  router.patch("/:importId", requirePermission("imports.run"), controller.updateRows);
  router.post("/:importId/commit", requirePermission("imports.run"), controller.commit);
  router.delete("/:importId", requirePermission("imports.run"), controller.discard);

  return router;
};
