import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { Quote } from "../../../../src/commerce/quotes/entities/quote.entity.js";
import { QuoteItem } from "../../../../src/commerce/quotes/entities/quote-item.entity.js";
import { QuoteServiceType } from "../../../../src/commerce/quotes/entities/quote-service-type.entity.js";
import { QuoteDao } from "../../../../src/commerce/quotes/daos/quote.dao.js";
import { QuoteItemDao } from "../../../../src/commerce/quotes/daos/quote-item.dao.js";
import { QuoteServiceTypeDao } from "../../../../src/commerce/quotes/daos/quote-service-type.dao.js";
import { QuoteService } from "../../../../src/commerce/quotes/services/quote.service.js";
import { Local } from "../../../../src/app_platform/local/entities/local.entity.js";
import { LocalDao } from "../../../../src/app_platform/local/daos/local.dao.js";
import { ensureFixtureTenant } from "../../../support/tenant-fixture.subscriber.js";
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
import { PriceListItem } from "../../../../src/commerce/price-list/entities/price-list-item.entity.js";
import { PriceListDao } from "../../../../src/commerce/price-list/daos/price-list.dao.js";
import { InventoryMovementDao } from "../../../../src/commerce/inventory/daos/inventory-movement.dao.js";
import { InventoryService } from "../../../../src/commerce/inventory/services/inventory.service.js";
import { InventoryReservation } from "../../../../src/commerce/inventory/entities/inventory-reservation.entity.js";
import { InventoryReservationDao } from "../../../../src/commerce/inventory/daos/inventory-reservation.dao.js";
import { InventoryReservationService } from "../../../../src/commerce/inventory/services/inventory-reservation.service.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

// Integration test against a real Postgres (same reasoning as
// inventory.service.test.ts/repair-note.service.test.ts): proves the
// transactional create/update + computed totalValue, not just mocked calls.
describe("QuoteService", () => {
  let service: QuoteService;
  let repairNoteServiceRef: RepairNoteService;
  const tenantId = `${Date.now()}3`;

  beforeAll(async () => {
    await AppDataSource.initialize();
    await ensureFixtureTenant(AppDataSource, tenantId);
    const quoteDao = new QuoteDao(AppDataSource.getRepository(Quote));
    const quoteItemDao = new QuoteItemDao(AppDataSource.getRepository(QuoteItem));
    const quoteServiceTypeDao = new QuoteServiceTypeDao(
      AppDataSource.getRepository(QuoteServiceType),
    );
    const localService = new LocalService(new LocalDao(AppDataSource.getRepository(Local)));
    const serviceTypeDao = new ServiceTypeDao(AppDataSource.getRepository(ServiceType));

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
    const repairNoteService = new RepairNoteService(
      new RepairNoteDao(AppDataSource.getRepository(RepairNote)),
      localService,
      new RepairNoteItemDao(AppDataSource.getRepository(RepairNoteItem)),
      inventoryService,
      new RepairNoteServiceTypeDao(AppDataSource.getRepository(RepairNoteServiceType)),
      serviceTypeDao,
      { getDisplayPhoneNumber: async () => null } as unknown as WhatsappAccountService,
      inventoryReservationService,
      new RepairNotePaymentDao(AppDataSource.getRepository(RepairNotePayment)),
      new RepairNoteDeviceDao(AppDataSource.getRepository(RepairNoteDevice)),
      { notifyStatusChange: async () => {} } as unknown as WhatsappNotificationQueueService,
      itemDao,
      new PriceListDao(AppDataSource.getRepository(PriceListItem)),
    );

    service = new QuoteService(
      quoteDao,
      quoteItemDao,
      quoteServiceTypeDao,
      localService,
      repairNoteService,
      serviceTypeDao,
      itemDao,
      new PriceListDao(AppDataSource.getRepository(PriceListItem)),
    );
    repairNoteServiceRef = repairNoteService;
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("rejects creating a quote with no items", async () => {
    const payload = { localId: "1", customerName: "Sin items" };
    await expect(runWithTenant(tenantId, () => service.create(payload, []))).rejects.toThrow(
      "al menos un producto",
    );
  });

  it("computes totalValue from the items, ignoring any client-sent value", async () => {
    // totalValue no es un campo de CreatePayload -- se manda igual (como
    // haria un cliente malicioso o un bug de UI) para probar que el service
    // lo ignora por completo y siempre recalcula desde los items.
    const payload = { localId: "1", customerName: "Juan", totalValue: 999 };
    const quote = await runWithTenant(tenantId, () =>
      service.create(payload, [
        { description: "Pantalla", quantity: 1, unitPrice: 500 },
        { description: "Mano de obra", quantity: 2, unitPrice: 50 },
      ]),
    );

    expect(Number(quote.totalValue)).toBe(600);
    expect(quote.status).toBe("pending");

    const items = await runWithTenant(tenantId, () => service.getItems(quote.id));
    expect(items).toHaveLength(2);
  });

  it("cada cotizacion recibe el siguiente folio consecutivo del taller", async () => {
    const create = () =>
      runWithTenant(tenantId, () =>
        service.create({ localId: "1", customerName: "Folio" }, [
          { description: "X", quantity: 1, unitPrice: 1 },
        ]),
      );
    const first = await create();
    const second = await create();
    expect(second.quoteNumber).toBe(first.quoteNumber + 1);
  });

  it("update replaces items and recalculates totalValue", async () => {
    const quote = await runWithTenant(tenantId, () =>
      service.create({ localId: "1", customerName: "Ana", contactNumber: "8330002222" }, [
        { description: "Item inicial", quantity: 1, unitPrice: 100 },
      ]),
    );

    const updated = await runWithTenant(tenantId, () =>
      service.update(quote.id, {}, [{ description: "Item nuevo", quantity: 3, unitPrice: 40 }]),
    );

    expect(Number(updated?.totalValue)).toBe(120);
    const items = await runWithTenant(tenantId, () => service.getItems(quote.id));
    expect(items.map((i) => i.description)).toEqual(["Item nuevo"]);
  });

  it("setStatus transitions a product quote without touching its items or total", async () => {
    const quote = await runWithTenant(tenantId, () =>
      service.create({ localId: "1", customerName: "Carlos", contactNumber: "8330003333" }, [
        { description: "Item", quantity: 1, unitPrice: 10 },
      ]),
    );

    const accepted = await runWithTenant(tenantId, () => service.setStatus(quote.id, "accepted"));
    expect(accepted?.status).toBe("accepted");
    expect(Number(accepted?.totalValue)).toBe(10);
    expect(accepted?.repairNoteId).toBeNull();
  });

  // Fase de cierre, bloque "cotizaciones de reparación": aceptar una
  // cotizacion de tipo "repair" crea la nota (cliente, equipo, falla, tipos
  // de servicio, valor total de la cotizacion); es idempotente (un segundo
  // accept no crea una segunda nota).
  it("accepting a repair quote creates the repair note with the customer, device, failure and service types, and is idempotent", async () => {
    const serviceType = await AppDataSource.getRepository(ServiceType).save({
      tenantId,
      name: `Diagnostico-${Date.now()}`,
    });

    const quote = await runWithTenant(tenantId, () =>
      service.create(
        {
          localId: "1",
          kind: "repair",
          customerName: "Cliente Cotizacion",
          contactNumber: "8330004444",
          brand: "Samsung",
          model: "A14",
          reportedFailure: "No enciende",
        },
        [{ description: "Diagnostico", quantity: 1, unitPrice: 200 }],
        [serviceType.id],
      ),
    );
    expect(quote.customerId).toBeTruthy();

    const accepted = await runWithTenant(tenantId, () => service.setStatus(quote.id, "accepted"));
    expect(accepted?.status).toBe("accepted");
    expect(accepted?.repairNoteId).toBeTruthy();

    const note = await runWithTenant(tenantId, () =>
      repairNoteServiceRef.getById(accepted!.repairNoteId!),
    );
    expect(note).toMatchObject({
      customerId: quote.customerId,
      customerName: "Cliente Cotizacion",
      devices: [
        { brand: "Samsung", model: "A14", reportedFailure: "No enciende", deviceOff: false },
      ],
    });
    expect(Number(note?.totalValue)).toBe(200);
    const serviceTypeIds = await runWithTenant(tenantId, () =>
      repairNoteServiceRef.getServiceTypeIds(note!.id),
    );
    expect(serviceTypeIds).toEqual([serviceType.id]);

    const acceptedAgain = await runWithTenant(tenantId, () =>
      service.setStatus(quote.id, "accepted"),
    );
    expect(acceptedAgain?.repairNoteId).toBe(accepted?.repairNoteId);
    const notesCount = await AppDataSource.getRepository(RepairNote).count({
      where: { customerId: quote.customerId } as never,
    });
    expect(notesCount).toBe(1);
  });

  it("accepting a product quote only changes status and never creates a note", async () => {
    const quote = await runWithTenant(tenantId, () =>
      service.create(
        { localId: "1", customerName: "Cliente Producto", contactNumber: "8330005555" },
        [{ description: "Cable", quantity: 1, unitPrice: 50 }],
      ),
    );

    const accepted = await runWithTenant(tenantId, () => service.setStatus(quote.id, "accepted"));
    expect(accepted?.repairNoteId).toBeNull();
  });
});
