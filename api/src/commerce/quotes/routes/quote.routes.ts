import { Router } from "express";
import { QuoteController } from "../controllers/quote.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

export const createQuoteRouter = (controller: QuoteController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/", requirePermission("quotes.read", "quotes.read.own"), controller.getAll);
  router.get("/:id", requirePermission("quotes.read", "quotes.read.own"), controller.getById);
  router.get("/:id/items", requirePermission("quotes.read", "quotes.read.own"), controller.getItems);
  router.get("/:id/service-types", requirePermission("quotes.read", "quotes.read.own"), controller.getServiceTypes);
  router.get("/:id/pdf", requirePermission("quotes.read", "quotes.read.own"), controller.getPdf);
  router.post("/", requirePermission("quotes.write", "quotes.write.own"), controller.create);
  router.patch("/:id", requirePermission("quotes.write", "quotes.write.own"), controller.update);
  router.patch("/:id/status", requirePermission("quotes.write", "quotes.write.own"), controller.setStatus);
  router.delete("/:id", requirePermission("quotes.delete"), controller.delete);
  return router;
};
