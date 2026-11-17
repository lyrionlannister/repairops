import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { Local } from "../../../../src/app_platform/local/entities/local.entity.js";
import { LocalDao } from "../../../../src/app_platform/local/daos/local.dao.js";
import { LocalService } from "../../../../src/app_platform/local/services/local.service.js";
import { RepairNote } from "../../../../src/commerce/repair-notes/entities/repair-note.entity.js";
import { RepairNoteItem } from "../../../../src/commerce/repair-notes/entities/repair-note-item.entity.js";
import { RepairNoteDao } from "../../../../src/commerce/repair-notes/daos/repair-note.dao.js";
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
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

// Integration test against a real Postgres. Fase 5, Pieza 3 (Inventario
// vivo): agregar una refaccion a una nota RESERVA (no descuenta stock real)
// hasta que la nota pasa a "done" por primera vez -- ahi la reserva se
// consume con un movimiento real. Antes de eso, cualquier edicion/cancelacion
// libera la reserva sin tocar quantityOnHand. Una vez "done", el
// comportamiento vuelve a ser el de siempre (movimiento real directo).
describe("RepairNoteService: reserva antes de 'done', consumo real al completar", () => {
  let repairNoteService: RepairNoteService;
  let inventoryService: InventoryService;
  let reservationDao: InventoryReservationDao;
  const tenantId = `${Date.now()}3`;

  const buildRepairNoteService = (whatsappAccountService: WhatsappAccountService) => {
    const inventoryReservationService = new InventoryReservationService(reservationDao, inventoryService);
    return new RepairNoteService(
      new RepairNoteDao(AppDataSource.getRepository(RepairNote)),
      new LocalService(new LocalDao(AppDataSource.getRepository(Local))),
      new RepairNoteItemDao(AppDataSource.getRepository(RepairNoteItem)),
      inventoryService,
      new RepairNoteServiceTypeDao(AppDataSource.getRepository(RepairNoteServiceType)),
      new ServiceTypeDao(AppDataSource.getRepository(ServiceType)),
      whatsappAccountService,
      inventoryReservationService,
    );
  };

  beforeAll(async () => {
    await AppDataSource.initialize();
    const itemDao = new InventoryItemDao(AppDataSource.getRepository(InventoryItem));
    const movementDao = new InventoryMovementDao(AppDataSource.getRepository(InventoryMovement));
    reservationDao = new InventoryReservationDao(AppDataSource.getRepository(InventoryReservation));
    inventoryService = new InventoryService(itemDao, movementDao, reservationDao);
    repairNoteService = buildRepairNoteService({ getDisplayPhoneNumber: async () => null } as unknown as WhatsappAccountService);
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("reserves stock (never decrements quantityOnHand) when the note is created with items", async () => {
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({ localId: "1", name: "Bateria A52", sku: "A52-BAT", kind: "part", costPrice: 150, salePrice: 300 }),
    );
    await runWithTenant(tenantId, () => inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 4 }));

    const note = await runWithTenant(tenantId, () =>
      repairNoteService.create(
        { localId: "1", customerName: "Cliente Items", brand: "Samsung", model: "A52", reportedFailure: "No carga", receivedAt: "2026-01-01" },
        [{ inventoryItemId: item.id, quantity: 1, unitPrice: 300 }],
      ),
    );

    const stock = await runWithTenant(tenantId, () => inventoryService.getById(item.id));
    expect(stock?.quantityOnHand).toBe(4); // nunca se descuenta todavia
    const available = await runWithTenant(tenantId, () => inventoryService.getAvailableQuantity(item.id));
    expect(available).toBe(3); // 4 fisico - 1 reservado

    const items = await runWithTenant(tenantId, () => repairNoteService.getItems(note.id));
    expect(items).toHaveLength(1);
    const reservation = await runWithTenant(tenantId, () => reservationDao.findByRelatedEntity("repair_note_item", items[0].id));
    expect(reservation?.status).toBe("active");
    expect(reservation?.quantity).toBe(1);
  });

  it("releases the old reservation and creates a new one on update, never touching quantityOnHand before done", async () => {
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({ localId: "1", name: "Flex A52", sku: "A52-FLEX", kind: "part", costPrice: 80, salePrice: 150 }),
    );
    await runWithTenant(tenantId, () => inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 5 }));

    const note = await runWithTenant(tenantId, () =>
      repairNoteService.create(
        { localId: "1", customerName: "Cliente Edicion", brand: "Samsung", model: "A52", reportedFailure: "No enciende", receivedAt: "2026-01-01" },
        [{ inventoryItemId: item.id, quantity: 2, unitPrice: 150 }],
      ),
    );
    const [firstItem] = await runWithTenant(tenantId, () => repairNoteService.getItems(note.id));
    expect((await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand).toBe(5);

    await runWithTenant(tenantId, () =>
      repairNoteService.update(note.id, {}, [{ inventoryItemId: item.id, quantity: 1, unitPrice: 150 }]),
    );

    expect((await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand).toBe(5); // fisico intacto
    const items = await runWithTenant(tenantId, () => repairNoteService.getItems(note.id));
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(1);

    // La reserva vieja se libera (status "released") -- el discriminador
    // relatedEntityType/Id ya no es una FK real (puede apuntar a dos tablas
    // distintas), asi que ya no hay cascada que la borre junto con la linea;
    // queda como historial, igual que cualquier fila "released".
    const oldReservation = await runWithTenant(tenantId, () => reservationDao.findByRelatedEntity("repair_note_item", firstItem.id));
    expect(oldReservation?.status).toBe("released");
    const newReservation = await runWithTenant(tenantId, () => reservationDao.findByRelatedEntity("repair_note_item", items[0].id));
    expect(newReservation?.status).toBe("active");
    expect(newReservation?.quantity).toBe(1);

    const available = await runWithTenant(tenantId, () => inventoryService.getAvailableQuantity(item.id));
    expect(available).toBe(4); // 5 - 1 reservado
  });

  it("cancels a note before done: releases the reservation without touching stock, and rejects a second cancel or a delivered note", async () => {
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({ localId: "1", name: "Pantalla A52", sku: "A52-SCR", kind: "part", costPrice: 400, salePrice: 700 }),
    );
    await runWithTenant(tenantId, () => inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 3 }));

    const note = await runWithTenant(tenantId, () =>
      repairNoteService.create(
        { localId: "1", customerName: "Cliente Cancela", brand: "Samsung", model: "A52", reportedFailure: "Pantalla rota", receivedAt: "2026-01-01", status: "received" },
        [{ inventoryItemId: item.id, quantity: 1, unitPrice: 700 }],
      ),
    );
    const [noteItem] = await runWithTenant(tenantId, () => repairNoteService.getItems(note.id));
    expect((await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand).toBe(3);

    const cancelled = await runWithTenant(tenantId, () => repairNoteService.cancel(note.id));
    expect(cancelled.status).toBe("cancelled");
    expect((await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand).toBe(3); // nunca se toco
    const reservation = await runWithTenant(tenantId, () => reservationDao.findByRelatedEntity("repair_note_item", noteItem.id));
    expect(reservation?.status).toBe("released");

    await expect(runWithTenant(tenantId, () => repairNoteService.cancel(note.id))).rejects.toThrow("La nota ya está cancelada");

    const delivered = await runWithTenant(tenantId, () =>
      repairNoteService.create(
        { localId: "1", customerName: "Cliente Entregado", brand: "Samsung", model: "A52", reportedFailure: "No enciende", receivedAt: "2026-01-01", status: "delivered" },
        [],
      ),
    );
    await expect(runWithTenant(tenantId, () => repairNoteService.cancel(delivered.id))).rejects.toThrow(
      "No se puede cancelar una nota ya entregada",
    );
  });

  it("consumes the active reservation into a real stock movement the first time the note moves to done, never again after that", async () => {

    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({ localId: "1", name: "Bateria Done", sku: "A52-BAT-DONE", kind: "part", costPrice: 150, salePrice: 300 }),
    );
    await runWithTenant(tenantId, () => inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 4 }));

    const note = await runWithTenant(tenantId, () =>
      repairNoteService.create(
        {
          localId: "1", customerName: "Cliente Listo",
          contactNumber: "5215500000000",
          brand: "Samsung",
          model: "A52",
          reportedFailure: "No carga",
          receivedAt: "2026-01-01",
          status: "received",
        },
        [{ inventoryItemId: item.id, quantity: 1, unitPrice: 300 }],
      ),
    );
    expect((await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand).toBe(4); // reservado, no descontado

    await runWithTenant(tenantId, () => repairNoteService.update(note.id, { status: "done" }));

    expect((await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand).toBe(3); // ahora si, consumido real
    const [noteItem] = await runWithTenant(tenantId, () => repairNoteService.getItems(note.id));
    const reservation = await runWithTenant(tenantId, () => reservationDao.findByRelatedEntity("repair_note_item", noteItem.id));
    expect(reservation?.status).toBe("consumed");
    expect(reservation?.consumedMovementId).not.toBeNull();

    // Guardar la nota otra vez sin salir de "done" no debe consumir una segunda vez.
    await runWithTenant(tenantId, () => repairNoteService.update(note.id, { technicianNotes: "revisado de nuevo" }));
    expect((await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand).toBe(3);
  });

  it("once a note is done, editing its items moves real stock directly (not a reservation)", async () => {
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({ localId: "1", name: "Mica Done", sku: "MICA-DONE", kind: "accessory", costPrice: 10, salePrice: 20 }),
    );
    await runWithTenant(tenantId, () => inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 10 }));

    const note = await runWithTenant(tenantId, () =>
      repairNoteService.create(
        { localId: "1", customerName: "Cliente Post-Done", brand: "Samsung", model: "A52", reportedFailure: "Rayones", receivedAt: "2026-01-01", status: "done" },
        [{ inventoryItemId: item.id, quantity: 2, unitPrice: 20 }],
      ),
    );
    // Nacio ya "done": consumo directo, nunca paso por reserva.
    expect((await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand).toBe(8);

    await runWithTenant(tenantId, () =>
      repairNoteService.update(note.id, {}, [{ inventoryItemId: item.id, quantity: 3, unitPrice: 20 }]),
    );
    // Revierte 2 (vuelve a 10) y descuenta 3 real de inmediato (queda en 7).
    expect((await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand).toBe(7);
  });

  it("cancelling an already-done note reverts the real stock movement directly", async () => {
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({ localId: "1", name: "Cargador Done", sku: "CARG-DONE", kind: "accessory", costPrice: 5, salePrice: 15 }),
    );
    await runWithTenant(tenantId, () => inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 5 }));

    const note = await runWithTenant(tenantId, () =>
      repairNoteService.create(
        { localId: "1", customerName: "Cliente Cancela Done", brand: "Samsung", model: "A52", reportedFailure: "No carga", receivedAt: "2026-01-01", status: "done" },
        [{ inventoryItemId: item.id, quantity: 1, unitPrice: 15 }],
      ),
    );
    expect((await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand).toBe(4);

    const cancelled = await runWithTenant(tenantId, () => repairNoteService.cancel(note.id));
    expect(cancelled.status).toBe("cancelled");
    expect((await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand).toBe(5); // revertido real
  });

  it("rejects a note without a branch (localId is required)", async () => {
    await expect(
      runWithTenant(tenantId, () =>
        repairNoteService.create({ customerName: "Sin sucursal", brand: "A", model: "B", reportedFailure: "x", receivedAt: "2026-01-01" } as never),
      ),
    ).rejects.toThrow("sucursal");
  });
});
