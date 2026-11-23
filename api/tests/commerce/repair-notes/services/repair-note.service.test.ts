import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { Local } from "../../../../src/app_platform/local/entities/local.entity.js";
import { LocalDao } from "../../../../src/app_platform/local/daos/local.dao.js";
import { LocalService } from "../../../../src/app_platform/local/services/local.service.js";
import { RepairNote } from "../../../../src/commerce/repair-notes/entities/repair-note.entity.js";
import { RepairNoteItem } from "../../../../src/commerce/repair-notes/entities/repair-note-item.entity.js";
import { RepairNoteDao } from "../../../../src/commerce/repair-notes/daos/repair-note.dao.js";
import { RepairNotePayment } from "../../../../src/commerce/repair-notes/entities/repair-note-payment.entity.js";
import { RepairNotePaymentDao } from "../../../../src/commerce/repair-notes/daos/repair-note-payment.dao.js";
import { RepairNoteDeviceDao } from "../../../../src/commerce/repair-notes/daos/repair-note-device.dao.js";
import { RepairNoteDevice } from "../../../../src/commerce/repair-notes/entities/repair-note-device.entity.js";
import { RepairNoteItemDao } from "../../../../src/commerce/repair-notes/daos/repair-note-item.dao.js";
import { RepairNoteServiceType } from "../../../../src/commerce/repair-notes/entities/repair-note-service-type.entity.js";
import { RepairNoteServiceTypeDao } from "../../../../src/commerce/repair-notes/daos/repair-note-service-type.dao.js";
import { ServiceType } from "../../../../src/commerce/service-types/entities/service-type.entity.js";
import { ServiceTypeDao } from "../../../../src/commerce/service-types/daos/service-type.dao.js";
import { RepairNoteService } from "../../../../src/commerce/repair-notes/services/repair-note.service.js";
import type { WhatsappAccountService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-account.service.js";
import type { WhatsappNotificationQueueService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-notification-queue.service.js";
import { InventoryItem } from "../../../../src/commerce/inventory/entities/inventory-item.entity.js";
import { InventoryMovement } from "../../../../src/commerce/inventory/entities/inventory-movement.entity.js";
import { InventoryItemDao } from "../../../../src/commerce/inventory/daos/inventory-item.dao.js";
import { InventoryMovementDao } from "../../../../src/commerce/inventory/daos/inventory-movement.dao.js";
import { InventoryService } from "../../../../src/commerce/inventory/services/inventory.service.js";
import { InventoryReservation } from "../../../../src/commerce/inventory/entities/inventory-reservation.entity.js";
import { InventoryReservationDao } from "../../../../src/commerce/inventory/daos/inventory-reservation.dao.js";
import { InventoryReservationService } from "../../../../src/commerce/inventory/services/inventory-reservation.service.js";
import { Customer } from "../../../../src/commerce/customers/entities/customer.entity.js";
import { Sale } from "../../../../src/commerce/inventory/entities/sale.entity.js";
import { SalePayment } from "../../../../src/commerce/payments/entities/sale-payment.entity.js";
import { CashSession } from "../../../../src/commerce/cash/entities/cash-session.entity.js";
import { CashMovement } from "../../../../src/commerce/cash/entities/cash-movement.entity.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

// Avisos de WhatsApp van por su propio suite de unit tests
// (whatsapp-notification-queue.service.test.ts); aqui, contra Postgres real,
// solo interesa el estado de la nota -- un stub evita red real hacia Meta.
const notificationQueueStub = {
  notifyStatusChange: async () => {},
} as unknown as WhatsappNotificationQueueService;

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
    const inventoryReservationService = new InventoryReservationService(
      reservationDao,
      inventoryService,
    );
    return new RepairNoteService(
      new RepairNoteDao(AppDataSource.getRepository(RepairNote)),
      new LocalService(new LocalDao(AppDataSource.getRepository(Local))),
      new RepairNoteItemDao(AppDataSource.getRepository(RepairNoteItem)),
      inventoryService,
      new RepairNoteServiceTypeDao(AppDataSource.getRepository(RepairNoteServiceType)),
      new ServiceTypeDao(AppDataSource.getRepository(ServiceType)),
      whatsappAccountService,
      inventoryReservationService,
      new RepairNotePaymentDao(AppDataSource.getRepository(RepairNotePayment)),
      new RepairNoteDeviceDao(AppDataSource.getRepository(RepairNoteDevice)),
      notificationQueueStub,
    );
  };

  beforeAll(async () => {
    await AppDataSource.initialize();
    const itemDao = new InventoryItemDao(AppDataSource.getRepository(InventoryItem));
    const movementDao = new InventoryMovementDao(AppDataSource.getRepository(InventoryMovement));
    reservationDao = new InventoryReservationDao(AppDataSource.getRepository(InventoryReservation));
    inventoryService = new InventoryService(itemDao, movementDao, reservationDao);
    repairNoteService = buildRepairNoteService({
      getDisplayPhoneNumber: async () => null,
    } as unknown as WhatsappAccountService);
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("reserves stock (never decrements quantityOnHand) when the note is created with items", async () => {
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: "1",
        name: "Bateria A52",
        sku: "A52-BAT",
        kind: "part",
        costPrice: 150,
        salePrice: 300,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 4 }),
    );

    const note = await runWithTenant(tenantId, () =>
      repairNoteService.create(
        {
          localId: "1",
          customerName: "Cliente Items",
          devices: [{ brand: "Samsung", model: "A52", reportedFailure: "No carga" }],
          receivedAt: "2026-01-01",
        },
        [{ inventoryItemId: item.id, quantity: 1, unitPrice: 300 }],
      ),
    );

    const stock = await runWithTenant(tenantId, () => inventoryService.getById(item.id));
    expect(stock?.quantityOnHand).toBe(4); // nunca se descuenta todavia
    const available = await runWithTenant(tenantId, () =>
      inventoryService.getAvailableQuantity(item.id),
    );
    expect(available).toBe(3); // 4 fisico - 1 reservado

    const items = await runWithTenant(tenantId, () => repairNoteService.getItems(note.id));
    expect(items).toHaveLength(1);
    const reservation = await runWithTenant(tenantId, () =>
      reservationDao.findByRelatedEntity("repair_note_item", items[0].id),
    );
    expect(reservation?.status).toBe("active");
    expect(reservation?.quantity).toBe(1);
  });

  it("releases the old reservation and creates a new one on update, never touching quantityOnHand before done", async () => {
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: "1",
        name: "Flex A52",
        sku: "A52-FLEX",
        kind: "part",
        costPrice: 80,
        salePrice: 150,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 5 }),
    );

    const note = await runWithTenant(tenantId, () =>
      repairNoteService.create(
        {
          localId: "1",
          customerName: "Cliente Edicion",
          devices: [{ brand: "Samsung", model: "A52", reportedFailure: "No enciende" }],
          receivedAt: "2026-01-01",
        },
        [{ inventoryItemId: item.id, quantity: 2, unitPrice: 150 }],
      ),
    );
    const [firstItem] = await runWithTenant(tenantId, () => repairNoteService.getItems(note.id));
    expect(
      (await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand,
    ).toBe(5);

    await runWithTenant(tenantId, () =>
      repairNoteService.update(note.id, {}, [
        { inventoryItemId: item.id, quantity: 1, unitPrice: 150 },
      ]),
    );

    expect(
      (await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand,
    ).toBe(5); // fisico intacto
    const items = await runWithTenant(tenantId, () => repairNoteService.getItems(note.id));
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(1);

    // La reserva vieja se libera (status "released") -- el discriminador
    // relatedEntityType/Id ya no es una FK real (puede apuntar a dos tablas
    // distintas), asi que ya no hay cascada que la borre junto con la linea;
    // queda como historial, igual que cualquier fila "released".
    const oldReservation = await runWithTenant(tenantId, () =>
      reservationDao.findByRelatedEntity("repair_note_item", firstItem.id),
    );
    expect(oldReservation?.status).toBe("released");
    const newReservation = await runWithTenant(tenantId, () =>
      reservationDao.findByRelatedEntity("repair_note_item", items[0].id),
    );
    expect(newReservation?.status).toBe("active");
    expect(newReservation?.quantity).toBe(1);

    const available = await runWithTenant(tenantId, () =>
      inventoryService.getAvailableQuantity(item.id),
    );
    expect(available).toBe(4); // 5 - 1 reservado
  });

  it("cancels a note before done: releases the reservation without touching stock, and rejects a second cancel or a delivered note", async () => {
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: "1",
        name: "Pantalla A52",
        sku: "A52-SCR",
        kind: "part",
        costPrice: 400,
        salePrice: 700,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 3 }),
    );

    const note = await runWithTenant(tenantId, () =>
      repairNoteService.create(
        {
          localId: "1",
          customerName: "Cliente Cancela",
          devices: [{ brand: "Samsung", model: "A52", reportedFailure: "Pantalla rota" }],
          receivedAt: "2026-01-01",
          status: "received",
        },
        [{ inventoryItemId: item.id, quantity: 1, unitPrice: 700 }],
      ),
    );
    const [noteItem] = await runWithTenant(tenantId, () => repairNoteService.getItems(note.id));
    expect(
      (await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand,
    ).toBe(3);

    const cancelled = await runWithTenant(tenantId, () => repairNoteService.cancel(note.id));
    expect(cancelled.status).toBe("cancelled");
    expect(
      (await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand,
    ).toBe(3); // nunca se toco
    const reservation = await runWithTenant(tenantId, () =>
      reservationDao.findByRelatedEntity("repair_note_item", noteItem.id),
    );
    expect(reservation?.status).toBe("released");

    await expect(runWithTenant(tenantId, () => repairNoteService.cancel(note.id))).rejects.toThrow(
      "La nota ya está cancelada",
    );

    const delivered = await runWithTenant(tenantId, () =>
      repairNoteService.create(
        {
          localId: "1",
          customerName: "Cliente Entregado",
          devices: [{ brand: "Samsung", model: "A52", reportedFailure: "No enciende" }],
          receivedAt: "2026-01-01",
          status: "delivered",
        },
        [],
      ),
    );
    await expect(
      runWithTenant(tenantId, () => repairNoteService.cancel(delivered.id)),
    ).rejects.toThrow("No se puede cancelar una nota ya entregada");
  });

  it("consumes the active reservation into a real stock movement the first time the note moves to done, never again after that", async () => {
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: "1",
        name: "Bateria Done",
        sku: "A52-BAT-DONE",
        kind: "part",
        costPrice: 150,
        salePrice: 300,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 4 }),
    );

    const note = await runWithTenant(tenantId, () =>
      repairNoteService.create(
        {
          localId: "1",
          customerName: "Cliente Listo",
          contactNumber: "5215500000000",
          devices: [{ brand: "Samsung", model: "A52", reportedFailure: "No carga" }],
          receivedAt: "2026-01-01",
          status: "received",
        },
        [{ inventoryItemId: item.id, quantity: 1, unitPrice: 300 }],
      ),
    );
    expect(
      (await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand,
    ).toBe(4); // reservado, no descontado

    await runWithTenant(tenantId, () => repairNoteService.update(note.id, { status: "done" }));

    expect(
      (await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand,
    ).toBe(3); // ahora si, consumido real
    const [noteItem] = await runWithTenant(tenantId, () => repairNoteService.getItems(note.id));
    const reservation = await runWithTenant(tenantId, () =>
      reservationDao.findByRelatedEntity("repair_note_item", noteItem.id),
    );
    expect(reservation?.status).toBe("consumed");
    expect(reservation?.consumedMovementId).not.toBeNull();

    // Guardar la nota otra vez sin salir de "done" no debe consumir una segunda vez.
    await runWithTenant(tenantId, () =>
      repairNoteService.update(note.id, { technicianNotes: "revisado de nuevo" }),
    );
    expect(
      (await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand,
    ).toBe(3);
  });

  it("once a note is done, editing its items moves real stock directly (not a reservation)", async () => {
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: "1",
        name: "Mica Done",
        sku: "MICA-DONE",
        kind: "accessory",
        costPrice: 10,
        salePrice: 20,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 10 }),
    );

    const note = await runWithTenant(tenantId, () =>
      repairNoteService.create(
        {
          localId: "1",
          customerName: "Cliente Post-Done",
          devices: [{ brand: "Samsung", model: "A52", reportedFailure: "Rayones" }],
          receivedAt: "2026-01-01",
          status: "done",
        },
        [{ inventoryItemId: item.id, quantity: 2, unitPrice: 20 }],
      ),
    );
    // Nacio ya "done": consumo directo, nunca paso por reserva.
    expect(
      (await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand,
    ).toBe(8);

    await runWithTenant(tenantId, () =>
      repairNoteService.update(note.id, {}, [
        { inventoryItemId: item.id, quantity: 3, unitPrice: 20 },
      ]),
    );
    // Revierte 2 (vuelve a 10) y descuenta 3 real de inmediato (queda en 7).
    expect(
      (await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand,
    ).toBe(7);
  });

  it("cancelling an already-done note reverts the real stock movement directly", async () => {
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: "1",
        name: "Cargador Done",
        sku: "CARG-DONE",
        kind: "accessory",
        costPrice: 5,
        salePrice: 15,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 5 }),
    );

    const note = await runWithTenant(tenantId, () =>
      repairNoteService.create(
        {
          localId: "1",
          customerName: "Cliente Cancela Done",
          devices: [{ brand: "Samsung", model: "A52", reportedFailure: "No carga" }],
          receivedAt: "2026-01-01",
          status: "done",
        },
        [{ inventoryItemId: item.id, quantity: 1, unitPrice: 15 }],
      ),
    );
    expect(
      (await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand,
    ).toBe(4);

    const cancelled = await runWithTenant(tenantId, () => repairNoteService.cancel(note.id));
    expect(cancelled.status).toBe("cancelled");
    expect(
      (await runWithTenant(tenantId, () => inventoryService.getById(item.id)))?.quantityOnHand,
    ).toBe(5); // revertido real
  });

  it("rejects a note without a branch (localId is required)", async () => {
    await expect(
      runWithTenant(tenantId, () =>
        repairNoteService.create({
          customerName: "Sin sucursal",
          devices: [{ brand: "A", model: "B", reportedFailure: "x" }],
          receivedAt: "2026-01-01",
        } as never),
      ),
    ).rejects.toThrow("sucursal");
  });
  it("guarda los tipos de servicio de cada equipo y los reemplaza al editar los equipos", async () => {
    const types = new ServiceTypeDao(AppDataSource.getRepository(ServiceType));
    const repair = await runWithTenant(tenantId, () =>
      types.create({ name: "Reparación por equipo" }),
    );
    const diagnosis = await runWithTenant(tenantId, () =>
      types.create({ name: "Diagnóstico por equipo" }),
    );
    const note = await runWithTenant(tenantId, () =>
      repairNoteService.create({
        localId: "1",
        customerName: "Cliente Tipos",
        receivedAt: "2026-01-01",
        devices: [
          {
            brand: "Samsung",
            model: "A52",
            reportedFailure: "No carga",
            serviceTypeIds: [repair.id, repair.id],
          },
          {
            brand: "Apple",
            model: "iPhone 12",
            reportedFailure: "Mojado",
            serviceTypeIds: [diagnosis.id],
          },
        ],
      }),
    );

    const loaded = await runWithTenant(tenantId, () => repairNoteService.getById(note.id));
    expect(loaded?.devices.map((d) => d.serviceTypeIds)).toEqual([[repair.id], [diagnosis.id]]);

    await runWithTenant(tenantId, () =>
      repairNoteService.update(note.id, {
        devices: [
          {
            brand: "Samsung",
            model: "A52",
            reportedFailure: "No carga",
            serviceTypeIds: [diagnosis.id, repair.id],
          },
        ],
      }),
    );
    const edited = await runWithTenant(tenantId, () => repairNoteService.getById(note.id));
    expect(edited?.devices).toHaveLength(1);
    expect([...(edited?.devices[0]?.serviceTypeIds ?? [])].sort()).toEqual(
      [diagnosis.id, repair.id].sort(),
    );
    expect(
      await runWithTenant(`${tenantId}9`, () => repairNoteService.getById(note.id)),
    ).toBeNull();
  });

  it("crea un cliente cuando la nota llega sin customerId, y lo reutiliza con el mismo nombre y teléfono", async () => {
    const base = {
      localId: "1",
      devices: [{ brand: "Apple", model: "iPhone 12", reportedFailure: "No enciende" }],
      receivedAt: "2026-01-01",
    };
    const first = await runWithTenant(tenantId, () =>
      repairNoteService.create({ ...base, customerName: "Ana Nueva", contactNumber: "8330001111" }),
    );
    expect(first.customerId).toBeTruthy();
    const customer = await AppDataSource.getRepository(Customer).findOneBy({
      id: first.customerId!,
    });
    expect(customer).toMatchObject({ name: "Ana Nueva", phone: "8330001111" });

    const second = await runWithTenant(tenantId, () =>
      repairNoteService.create({ ...base, customerName: "ana nueva", contactNumber: "8330001111" }),
    );
    expect(second.customerId).toBe(first.customerId);

    const other = await runWithTenant(tenantId, () =>
      repairNoteService.create({
        ...base,
        customerName: "Otra Persona",
        contactNumber: "8330001111",
      }),
    );
    expect(other.customerId).not.toBe(first.customerId);
  });
});

// Anticipo (cobrado al recibir el equipo) y entrega (cobro del saldo):
// ambos mueven dinero real de caja, así que se prueban contra Postgres real,
// no con mocks. Cada test usa su propia sucursal fixture (ver
// FIXTURE_BRANCH_IDS en tests/global-teardown.ts) para no pisar la sesión
// de caja de otro test del mismo archivo.
describe("RepairNoteService: anticipo y entrega", () => {
  let repairNoteService: RepairNoteService;
  const tenantId = `${Date.now()}7`;

  const buildRepairNoteService = (whatsappAccountService: WhatsappAccountService) => {
    const itemDao = new InventoryItemDao(AppDataSource.getRepository(InventoryItem));
    const movementDao = new InventoryMovementDao(AppDataSource.getRepository(InventoryMovement));
    const reservationDao = new InventoryReservationDao(
      AppDataSource.getRepository(InventoryReservation),
    );
    const inventoryService = new InventoryService(itemDao, movementDao, reservationDao);
    const inventoryReservationService = new InventoryReservationService(
      reservationDao,
      inventoryService,
    );
    return new RepairNoteService(
      new RepairNoteDao(AppDataSource.getRepository(RepairNote)),
      new LocalService(new LocalDao(AppDataSource.getRepository(Local))),
      new RepairNoteItemDao(AppDataSource.getRepository(RepairNoteItem)),
      inventoryService,
      new RepairNoteServiceTypeDao(AppDataSource.getRepository(RepairNoteServiceType)),
      new ServiceTypeDao(AppDataSource.getRepository(ServiceType)),
      whatsappAccountService,
      inventoryReservationService,
      new RepairNotePaymentDao(AppDataSource.getRepository(RepairNotePayment)),
      new RepairNoteDeviceDao(AppDataSource.getRepository(RepairNoteDevice)),
      notificationQueueStub,
    );
  };

  const baseNote = (localId: string, overrides: Record<string, unknown> = {}) => ({
    localId,
    customerName: "Cliente de prueba",
    contactNumber: "8339990000",
    devices: [{ brand: "Marca", model: "Modelo", reportedFailure: "Falla" }],
    receivedAt: "2026-01-01",
    ...overrides,
  });

  beforeAll(async () => {
    await AppDataSource.initialize();
    repairNoteService = buildRepairNoteService({
      getDisplayPhoneNumber: async () => null,
    } as unknown as WhatsappAccountService);
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("rejects charging an advance without an open cash session", async () => {
    await expect(
      runWithTenant(tenantId, () =>
        repairNoteService.create(
          baseNote("9001", { requiresAdvance: true, advanceValue: 100 }),
          [],
          { method: "efectivo", createdByEmployeeId: "1" },
        ),
      ),
    ).rejects.toThrow("Abre la caja");
  });

  it("charging an advance creates its payment and a cash movement 'Anticipo nota #N'", async () => {
    const localId = "9002";
    await AppDataSource.getRepository(CashSession).save({
      tenantId,
      localId,
      openingBalance: "0",
      status: "open",
    });

    const note = await runWithTenant(tenantId, () =>
      repairNoteService.create(
        baseNote(localId, { requiresAdvance: true, advanceValue: 150 }),
        [],
        { method: "efectivo", createdByEmployeeId: "1" },
      ),
    );

    const payments = await runWithTenant(tenantId, () => repairNoteService.getPayments(note.id));
    expect(payments).toHaveLength(1);
    expect(payments[0]).toMatchObject({ kind: "advance", method: "efectivo" });
    expect(Number(payments[0].amount)).toBe(150);

    const session = await AppDataSource.getRepository(CashSession).findOneBy({ tenantId, localId });
    const movements = await AppDataSource.getRepository(CashMovement).find({
      where: { tenantId, cashSessionId: session!.id },
    });
    const advanceMovement = movements.find(
      (m) => m.note === `Anticipo nota #${note.controlNumber}`,
    );
    expect(advanceMovement).toBeTruthy();
    expect(Number(advanceMovement!.amount)).toBe(150);
    expect(advanceMovement!.relatedEntityType).toBe("repair_note");
  });

  it("rejects editing the advance once it has already been charged", async () => {
    const localId = "42";
    await AppDataSource.getRepository(CashSession).save({
      tenantId,
      localId,
      openingBalance: "0",
      status: "open",
    });
    const note = await runWithTenant(tenantId, () =>
      repairNoteService.create(baseNote(localId, { requiresAdvance: true, advanceValue: 80 }), [], {
        method: "efectivo",
        createdByEmployeeId: "1",
      }),
    );

    await expect(
      runWithTenant(tenantId, () => repairNoteService.update(note.id, { advanceValue: "999" })),
    ).rejects.toThrow("ya se cobró");
    await expect(
      runWithTenant(tenantId, () => repairNoteService.update(note.id, { requiresAdvance: false })),
    ).rejects.toThrow("ya se cobró");
  });

  it("deliver rejects when the payments don't sum the note's balance", async () => {
    const localId = "1";
    const note = await runWithTenant(tenantId, () =>
      repairNoteService.create(baseNote(localId, { totalValue: 1000 })),
    );
    await runWithTenant(tenantId, () => repairNoteService.update(note.id, { status: "done" }));

    await expect(
      runWithTenant(tenantId, () =>
        repairNoteService.deliver(note.id, { payments: [{ method: "efectivo", amount: 500 }] }),
      ),
    ).rejects.toThrow("deben sumar el saldo");
  });

  it("deliver to credito requires a registered customer", async () => {
    const localId = "2";
    const note = await runWithTenant(tenantId, () =>
      repairNoteService.create({
        localId,
        customerName: "Sin teléfono",
        devices: [{ brand: "A", model: "B", reportedFailure: "x" }],
        receivedAt: "2026-01-01",
        totalValue: "300",
      }),
    );
    expect(note.customerId).toBeNull();
    await runWithTenant(tenantId, () => repairNoteService.update(note.id, { status: "done" }));

    await expect(
      runWithTenant(tenantId, () =>
        repairNoteService.deliver(note.id, {
          payments: [{ method: "credito", amount: 300, dueDate: "2099-12-31" }],
        }),
      ),
    ).rejects.toThrow("crédito requiere un cliente");
  });

  it("deliver to credito respects the limit, counting debt from both sales and other notes", async () => {
    const localId = "3";
    const customer = await AppDataSource.getRepository(Customer).save({
      tenantId,
      name: "Cliente Límite",
      phone: "8330004000",
      creditLimit: "500",
    });

    const sale = await AppDataSource.getRepository(Sale).save({
      tenantId,
      localId,
      saleNumber: Math.floor(Date.now() / 1000),
      customerId: customer.id,
      customerName: customer.name,
      cashSessionId: "1",
      origin: "counter",
      subtotal: "200",
      totalValue: "200",
      createdByEmployeeId: null,
      idempotencyKey: null,
    });
    await AppDataSource.getRepository(SalePayment).save({
      tenantId,
      saleId: sale.id,
      method: "credito",
      amount: "200",
    });

    const otherNote = await runWithTenant(tenantId, () =>
      repairNoteService.create({
        localId,
        customerId: customer.id,
        customerName: customer.name,
        devices: [{ brand: "A", model: "B", reportedFailure: "x" }],
        receivedAt: "2026-01-01",
        totalValue: "200",
      }),
    );
    await runWithTenant(tenantId, () => repairNoteService.update(otherNote.id, { status: "done" }));
    await runWithTenant(tenantId, () =>
      repairNoteService.deliver(otherNote.id, {
        payments: [{ method: "credito", amount: 200, dueDate: "2099-12-31" }],
      }),
    );

    // Deuda existente: 200 (venta) + 200 (nota) = 400. Límite 500. Esta nota
    // de 200 más a crédito dejaría 600 > 500: debe rechazarse.
    const newNote = await runWithTenant(tenantId, () =>
      repairNoteService.create({
        localId,
        customerId: customer.id,
        customerName: customer.name,
        devices: [{ brand: "A", model: "B", reportedFailure: "x" }],
        receivedAt: "2026-01-01",
        totalValue: "200",
      }),
    );
    await runWithTenant(tenantId, () => repairNoteService.update(newNote.id, { status: "done" }));

    await expect(
      runWithTenant(tenantId, () =>
        repairNoteService.deliver(newNote.id, {
          payments: [{ method: "credito", amount: 200, dueDate: "2099-12-31" }],
        }),
      ),
    ).rejects.toThrow("supera el límite");
  });

  it("deliver only works once the note is 'done'", async () => {
    const localId = "4";
    const note = await runWithTenant(tenantId, () =>
      repairNoteService.create(baseNote(localId, { totalValue: 100 })),
    );

    await expect(
      runWithTenant(tenantId, () =>
        repairNoteService.deliver(note.id, { payments: [{ method: "efectivo", amount: 100 }] }),
      ),
    ).rejects.toThrow("debe estar Lista");
  });

  it("a note cannot be delivered through a plain status PATCH", async () => {
    const localId = "5";
    const note = await runWithTenant(tenantId, () =>
      repairNoteService.create(baseNote(localId, { totalValue: 100 })),
    );
    await runWithTenant(tenantId, () => repairNoteService.update(note.id, { status: "done" }));

    await expect(
      runWithTenant(tenantId, () => repairNoteService.update(note.id, { status: "delivered" })),
    ).rejects.toThrow("usa Entregar");
  });

  it("a note keeps several devices in order, and an update replaces them", async () => {
    const note = await runWithTenant(tenantId, () =>
      repairNoteService.create(
        baseNote("6", {
          devices: [
            { brand: " Samsung ", model: "A52", reportedFailure: "Pantalla rota" },
            { brand: "Apple", model: "iPhone 12", reportedFailure: "No carga", deviceOff: true },
          ],
        }),
      ),
    );
    expect(note.devices).toEqual([
      {
        brand: "Samsung",
        model: "A52",
        reportedFailure: "Pantalla rota",
        deviceOff: false,
        serviceTypeIds: [],
      },
      {
        brand: "Apple",
        model: "iPhone 12",
        reportedFailure: "No carga",
        deviceOff: true,
        serviceTypeIds: [],
      },
    ]);

    await runWithTenant(tenantId, () =>
      repairNoteService.update(note.id, {
        devices: [{ brand: "Xiaomi", model: "Redmi 9", reportedFailure: "Bateria" }],
      }),
    );
    const reloaded = await runWithTenant(tenantId, () => repairNoteService.getById(note.id));
    expect(reloaded?.devices.map((d) => d.model)).toEqual(["Redmi 9"]);

    const all = await runWithTenant(tenantId, () => repairNoteService.getAll("6"));
    expect(all.find((n) => n.id === note.id)?.devices).toHaveLength(1);
  });

  it("rejects a note without devices or with an incomplete device", async () => {
    await expect(
      runWithTenant(tenantId, () => repairNoteService.create(baseNote("6", { devices: [] }))),
    ).rejects.toThrow("al menos un equipo");
    await expect(
      runWithTenant(tenantId, () =>
        repairNoteService.create(
          baseNote("6", {
            devices: [
              { brand: "A", model: "B", reportedFailure: "x" },
              { brand: "A", model: " ", reportedFailure: "x" },
            ],
          }),
        ),
      ),
    ).rejects.toThrow("modelo del equipo 2");
  });

  it("another tenant never sees a note's devices", async () => {
    const note = await runWithTenant(tenantId, () => repairNoteService.create(baseNote("6")));
    expect(
      await runWithTenant(`${tenantId}9`, () => repairNoteService.getById(note.id)),
    ).toBeNull();
    await expect(
      runWithTenant(`${tenantId}9`, () =>
        repairNoteService.update(note.id, {
          devices: [{ brand: "X", model: "Y", reportedFailure: "z" }],
        }),
      ),
    ).resolves.toBeNull();
    const own = await runWithTenant(tenantId, () => repairNoteService.getById(note.id));
    expect(own?.devices.map((d) => d.brand)).toEqual(["Marca"]);
  });

  it("deliver to credito requires a due date and stores it on the payment", async () => {
    const localId = "7";
    const customer = await AppDataSource.getRepository(Customer).save({
      tenantId,
      name: "Cliente Plazo",
      phone: "8330007000",
      creditLimit: "1000",
    });
    const note = await runWithTenant(tenantId, () =>
      repairNoteService.create(
        baseNote(localId, {
          customerId: customer.id,
          customerName: customer.name,
          totalValue: "300",
        }),
      ),
    );
    await runWithTenant(tenantId, () => repairNoteService.update(note.id, { status: "done" }));

    await expect(
      runWithTenant(tenantId, () =>
        repairNoteService.deliver(note.id, { payments: [{ method: "credito", amount: 300 }] }),
      ),
    ).rejects.toThrow("fecha límite");

    await runWithTenant(tenantId, () =>
      repairNoteService.deliver(note.id, {
        payments: [{ method: "credito", amount: 300, dueDate: "2099-12-31" }],
      }),
    );
    const payments = await runWithTenant(tenantId, () => repairNoteService.getPayments(note.id));
    expect(payments.map((p) => [p.method, p.dueDate])).toEqual([["credito", "2099-12-31"]]);
  });
});
