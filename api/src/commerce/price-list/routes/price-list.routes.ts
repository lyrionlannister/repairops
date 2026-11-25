import { Router } from "express";
import { PriceListController } from "../controllers/price-list.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";
import { publicIdParam } from "../../../core/http/public-id/public-id-request.js";

export const createPriceListRouter = (controller: PriceListController): Router => {
  const router = Router();
  router.param("id", publicIdParam("price_list_items"));
  router.use(authMiddleware, tenantMiddleware);

  router.get("/", requirePermission("settings.manage"), controller.getAll);
  router.get("/brands", requirePermission("settings.manage"), controller.getBrands);
  router.get("/:id", requirePermission("settings.manage"), controller.getById);
  router.post("/", requirePermission("settings.manage"), controller.create);
  router.patch("/:id", requirePermission("settings.manage"), controller.update);
  router.delete("/:id", requirePermission("settings.manage"), controller.delete);
  return router;
};
