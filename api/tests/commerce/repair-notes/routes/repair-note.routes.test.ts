import "reflect-metadata";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { requireJwtSecret } from "../../../../src/identity/auth/jwt-secret.js";
import { User } from "../../../../src/identity/auth/entities/user.entity.js";
import { UserDao } from "../../../../src/identity/auth/daos/user.dao.js";
import { AuthService } from "../../../../src/identity/auth/services/auth.service.js";
import { Tenant } from "../../../../src/core/tenancy/entities/tenant.entity.js";
import { Local } from "../../../../src/app_platform/local/entities/local.entity.js";
import { LocalDao } from "../../../../src/app_platform/local/daos/local.dao.js";
import { LocalService } from "../../../../src/app_platform/local/services/local.service.js";
import { RepairNote } from "../../../../src/commerce/repair-notes/entities/repair-note.entity.js";
import { RepairNoteDao } from "../../../../src/commerce/repair-notes/daos/repair-note.dao.js";
import { RepairNoteItem } from "../../../../src/commerce/repair-notes/entities/repair-note-item.entity.js";
import { RepairNoteItemDao } from "../../../../src/commerce/repair-notes/daos/repair-note-item.dao.js";
import { RepairNoteServiceType } from "../../../../src/commerce/repair-notes/entities/repair-note-service-type.entity.js";
import { RepairNoteServiceTypeDao } from "../../../../src/commerce/repair-notes/daos/repair-note-service-type.dao.js";
import { ServiceType } from "../../../../src/commerce/service-types/entities/service-type.entity.js";
import { ServiceTypeDao } from "../../../../src/commerce/service-types/daos/service-type.dao.js";
import { RepairNoteService } from "../../../../src/commerce/repair-notes/services/repair-note.service.js";
import type { WhatsappAccountService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-account.service.js";
import { InventoryItem } from "../../../../src/commerce/inventory/entities/inventory-item.entity.js";
import { InventoryMovement } from "../../../../src/commerce/inventory/entities/inventory-movement.entity.js";
import { InventoryItemDao } from "../../../../src/commerce/inventory/daos/inventory-item.dao.js";
import { InventoryMovementDao } from "../../../../src/commerce/inventory/daos/inventory-movement.dao.js";
import { InventoryService } from "../../../../src/commerce/inventory/services/inventory.service.js";
import { InventoryReservation } from "../../../../src/commerce/inventory/entities/inventory-reservation.entity.js";
import { InventoryReservationDao } from "../../../../src/commerce/inventory/daos/inventory-reservation.dao.js";
import { InventoryReservationService } from "../../../../src/commerce/inventory/services/inventory-reservation.service.js";
import { RepairNoteController } from "../../../../src/commerce/repair-notes/controllers/repair-note.controller.js";
import { PdfRendererService } from "../../../../src/reporting/pdf/pdf-renderer.service.js";
import { createRepairNoteRouter } from "../../../../src/commerce/repair-notes/routes/repair-note.routes.js";
import type { UserRole } from "../../../../src/identity/auth/entities/user.entity.js";
import { ensureFixtureTenant } from "../../../support/tenant-fixture.subscriber.js";

// Integration test contra Postgres real + el router real (no un controller
// falso) -- prueba el criterio de aceptacion de la Fase 1: un cajero no
// puede crear/editar/cancelar/eliminar una nota de reparacion NI POR API,
// aunque la pantalla ya le oculte el boton (ver skill tenant-isolation,
// "modulo" como limite de autorizacion).
describe("repair-note routes: permisos por rol (modulo Taller)", () => {
  let app: express.Express;
  const tenantId = `${Date.now()}4`;

  const tokenFor = (role: UserRole) =>
    jwt.sign({ id: "1", email: "x@x.com", tenantId, role }, requireJwtSecret());

  beforeAll(async () => {
    await AppDataSource.initialize();
    await ensureFixtureTenant(AppDataSource, tenantId);

    const localService = new LocalService(new LocalDao(AppDataSource.getRepository(Local)));
    const inventoryService = new InventoryService(
      new InventoryItemDao(AppDataSource.getRepository(InventoryItem)),
      new InventoryMovementDao(AppDataSource.getRepository(InventoryMovement)),
      new InventoryReservationDao(AppDataSource.getRepository(InventoryReservation)),
    );
    const inventoryReservationService = new InventoryReservationService(
      new InventoryReservationDao(AppDataSource.getRepository(InventoryReservation)),
      inventoryService,
    );
    const repairNoteService = new RepairNoteService(
      new RepairNoteDao(AppDataSource.getRepository(RepairNote)),
      localService,
      new RepairNoteItemDao(AppDataSource.getRepository(RepairNoteItem)),
      inventoryService,
      new RepairNoteServiceTypeDao(AppDataSource.getRepository(RepairNoteServiceType)),
      new ServiceTypeDao(AppDataSource.getRepository(ServiceType)),
      { getDisplayPhoneNumber: async () => null } as unknown as WhatsappAccountService,
      inventoryReservationService,
    );
    const authService = new AuthService(
      new UserDao(AppDataSource.getRepository(User)),
      AppDataSource.getRepository(Tenant),
    );
    const controller = new RepairNoteController(
      repairNoteService,
      localService,
      new PdfRendererService(),
      authService,
    );

    app = express();
    app.use(express.json());
    app.use("/repair-notes", createRepairNoteRouter(controller));
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  const newNotePayload = {
    localId: "1",
    customerName: "Cliente de prueba",
    brand: "Marca",
    model: "Modelo",
    reportedFailure: "Falla de prueba",
    receivedAt: "2026-01-01",
  };

  it("rejects a cashier creating a repair note (403), but allows read", async () => {
    const cashierToken = tokenFor("cashier");

    const createRes = await request(app)
      .post("/repair-notes")
      .set("Authorization", `Bearer ${cashierToken}`)
      .send(newNotePayload);
    expect(createRes.status).toBe(403);

    const readRes = await request(app)
      .get("/repair-notes")
      .set("Authorization", `Bearer ${cashierToken}`);
    expect(readRes.status).toBe(200);
  });

  it("allows a technician to create, update and cancel a repair note", async () => {
    const technicianToken = tokenFor("technician");

    const createRes = await request(app)
      .post("/repair-notes")
      .set("Authorization", `Bearer ${technicianToken}`)
      .send(newNotePayload);
    expect(createRes.status).toBe(201);
    const noteId = createRes.body.id;

    const updateRes = await request(app)
      .patch(`/repair-notes/${noteId}`)
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({ technicianNotes: "Diagnóstico actualizado" });
    expect(updateRes.status).toBe(200);

    const cancelRes = await request(app)
      .post(`/repair-notes/${noteId}/cancel`)
      .set("Authorization", `Bearer ${technicianToken}`);
    expect(cancelRes.status).toBe(200);
  });

  it("rejects a cashier updating or cancelling an existing note", async () => {
    const technicianToken = tokenFor("technician");
    const cashierToken = tokenFor("cashier");

    const createRes = await request(app)
      .post("/repair-notes")
      .set("Authorization", `Bearer ${technicianToken}`)
      .send(newNotePayload);
    const noteId = createRes.body.id;

    const updateRes = await request(app)
      .patch(`/repair-notes/${noteId}`)
      .set("Authorization", `Bearer ${cashierToken}`)
      .send({ technicianNotes: "No debería poder" });
    expect(updateRes.status).toBe(403);

    const cancelRes = await request(app)
      .post(`/repair-notes/${noteId}/cancel`)
      .set("Authorization", `Bearer ${cashierToken}`);
    expect(cancelRes.status).toBe(403);

    const deleteRes = await request(app)
      .delete(`/repair-notes/${noteId}`)
      .set("Authorization", `Bearer ${cashierToken}`);
    expect(deleteRes.status).toBe(403);
  });

  it("rejects requests without a valid token", async () => {
    const res = await request(app).post("/repair-notes").send(newNotePayload);
    expect(res.status).toBe(401);
  });

  it("finds a note by its control number (escáner) and 404s on an unknown one", async () => {
    const ownerToken = tokenFor("owner");

    const createRes = await request(app)
      .post("/repair-notes")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send(newNotePayload);
    const controlNumber = createRes.body.controlNumber;

    const foundRes = await request(app)
      .get(`/repair-notes/by-control-number/${controlNumber}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(foundRes.status).toBe(200);
    expect(foundRes.body.customerName).toBe(newNotePayload.customerName);

    const missingRes = await request(app)
      .get("/repair-notes/by-control-number/999999")
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(missingRes.status).toBe(404);
  });
});
