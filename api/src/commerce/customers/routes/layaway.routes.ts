import { Router } from "express";
import { LayawayController } from "../controllers/layaway.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";
import { publicIdParam } from "../../../core/http/public-id/public-id-request.js";


export const createLayawayRouter = (controller: LayawayController): Router => {
  const router = Router();
  router.param("id", publicIdParam("layaways"));
  router.use(authMiddleware, tenantMiddleware);
  router.get("/", requirePermission("layaways.read"), controller.getAll);
  router.get("/:id", requirePermission("layaways.read"), controller.getById);
  router.post("/", requirePermission("layaways.write"), controller.open);
  router.post("/:id/complete", requirePermission("layaways.write"), controller.complete);
  router.post("/:id/cancel", requirePermission("layaways.write"), controller.cancel);
  return router;
};
