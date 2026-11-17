import { Router } from "express";
import { RepairNoteController } from "../controllers/repair-note.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requireRole } from "../../../identity/auth/middlewares/require-role.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

// Modulo Taller: un cajero no edita ni crea diagnosticos de reparacion, ni
// por pantalla ni por API (criterio de aceptacion de la Fase 1). Lectura
// queda abierta a cualquier rol autenticado -- el cajero sí necesita ver una
// nota para cobrarla o entregar el equipo.
const canWriteRepairNotes = requireRole("owner", "technician");

export const createRepairNoteRouter = (controller: RepairNoteController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/", controller.getAll);
  router.get("/by-control-number/:controlNumber", controller.getByControlNumber);
  router.get("/:id", controller.getById);
  router.get("/:id/items", controller.getItems);
  router.get("/:id/service-types", controller.getServiceTypes);
  router.get("/:id/pdf", controller.getPdf);
  router.post("/", canWriteRepairNotes, controller.create);
  router.patch("/:id", canWriteRepairNotes, controller.update);
  router.post("/:id/cancel", canWriteRepairNotes, controller.cancel);
  router.delete("/:id", canWriteRepairNotes, controller.delete);
  return router;
};
