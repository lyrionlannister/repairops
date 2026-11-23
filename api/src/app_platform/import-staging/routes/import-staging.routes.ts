import { Router } from "express";
import express from "express";
import { ImportStagingController } from "../controllers/import-staging.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";
import {
  requireInternalToken,
  requireTenantFromHeader,
} from "../../../messaging/n8n/n8n-public.routes.js";

export const createImportStagingRouter = (controller: ImportStagingController): Router => {
  const router = Router();

  // Callback de n8n: sin JWT, gateado por el mismo secreto compartido que /api/v1/n8n/*.
  // El tenant viene en el header X-Tenant-Public-Id (validado contra la base)
  // y el tenantId del body solo se acepta si coincide con ese tenant -- nunca
  // se confía en el body solo. Ver requireTenantFromHeader en n8n-public.routes.ts.
  router.post("/callback", requireInternalToken, requireTenantFromHeader, controller.callback);
  // Progreso por bloque (ver Reportar progreso en el workflow n8n): mismo gate.
  router.post("/progress", requireInternalToken, requireTenantFromHeader, controller.progress);

  router.use(authMiddleware, tenantMiddleware);
  router.post(
    "/upload",
    requirePermission("imports.run"),
    express.raw({ type: "*/*", limit: "20mb" }),
    controller.upload,
  );
  router.get("/:importId/events", requirePermission("imports.run"), controller.events);
  router.get("/:importId", requirePermission("imports.run"), controller.getById);
  router.patch("/:importId", requirePermission("imports.run"), controller.updateRows);
  router.post("/:importId/commit", requirePermission("imports.run"), controller.commit);
  router.delete("/:importId", requirePermission("imports.run"), controller.discard);

  return router;
};
