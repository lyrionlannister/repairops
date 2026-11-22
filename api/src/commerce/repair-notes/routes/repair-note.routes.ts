import { Router } from "express";
import { RepairNoteController } from "../controllers/repair-note.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";


export const createRepairNoteRouter = (controller: RepairNoteController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/", requirePermission("repair-notes.read", "repair-notes.read.own"), controller.getAll);
  router.get("/by-control-number/:controlNumber", requirePermission("repair-notes.read", "repair-notes.read.own"), controller.getByControlNumber);
  router.get("/:id", requirePermission("repair-notes.read", "repair-notes.read.own"), controller.getById);
  router.get("/:id/items", requirePermission("repair-notes.read", "repair-notes.read.own"), controller.getItems);
  router.get("/:id/service-types", requirePermission("repair-notes.read", "repair-notes.read.own"), controller.getServiceTypes);
  router.get("/:id/pdf", requirePermission("repair-notes.read", "repair-notes.read.own"), controller.getPdf);
  router.get("/:id/payments", requirePermission("repair-notes.read", "repair-notes.read.own"), controller.getPayments);
  router.post("/", requirePermission("repair-notes.create", "repair-notes.create.own"), controller.create);
  router.patch("/:id", requirePermission("repair-notes.write", "repair-notes.write.own"), controller.update);
  router.post("/:id/cancel", requirePermission("repair-notes.write"), controller.cancel);
  router.post("/:id/deliver", requirePermission("repair-notes.deliver", "repair-notes.deliver.own"), controller.deliver);
  router.delete("/:id", requirePermission("repair-notes.delete"), controller.delete);
  return router;
};
