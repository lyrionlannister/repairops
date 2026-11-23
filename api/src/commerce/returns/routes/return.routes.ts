import { Router } from "express";
import { ReturnController } from "../controllers/return.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";
import { publicIdParam } from "../../../core/http/public-id/public-id-request.js";


export const createReturnRouter = (controller: ReturnController): Router => {
  const router = Router();
  router.param("id", publicIdParam("returns"));
  router.param("saleId", publicIdParam("sales"));
  router.use(authMiddleware, tenantMiddleware);
  router.get("/by-sale/:saleId", requirePermission("sales.read"), controller.getBySaleId);
  router.get("/:id", requirePermission("sales.read"), controller.getById);
  router.post("/", requirePermission("returns.create"), controller.create);
  return router;
};
