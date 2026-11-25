import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { InventoryItem } from "../../../../src/commerce/inventory/entities/inventory-item.entity.js";
import { InventoryMovement } from "../../../../src/commerce/inventory/entities/inventory-movement.entity.js";
import { Sale } from "../../../../src/commerce/inventory/entities/sale.entity.js";
import { SaleItem } from "../../../../src/commerce/inventory/entities/sale-item.entity.js";
import { InventoryItemDao } from "../../../../src/commerce/inventory/daos/inventory-item.dao.js";
import { PriceListItem } from "../../../../src/commerce/price-list/entities/price-list-item.entity.js";
import { PriceListDao } from "../../../../src/commerce/price-list/daos/price-list.dao.js";
import { InventoryMovementDao } from "../../../../src/commerce/inventory/daos/inventory-movement.dao.js";
import { InventoryReservation } from "../../../../src/commerce/inventory/entities/inventory-reservation.entity.js";
import { InventoryReservationDao } from "../../../../src/commerce/inventory/daos/inventory-reservation.dao.js";
import { SaleDao } from "../../../../src/commerce/inventory/daos/sale.dao.js";
import { SaleItemDao } from "../../../../src/commerce/inventory/daos/sale-item.dao.js";
import { SalePayment } from "../../../../src/commerce/payments/entities/sale-payment.entity.js";
import { SalePaymentDao } from "../../../../src/commerce/payments/daos/sale-payment.dao.js";
import { InventoryService } from "../../../../src/commerce/inventory/services/inventory.service.js";
import { SaleService } from "../../../../src/commerce/inventory/services/sale.service.js";
import { Local } from "../../../../src/app_platform/local/entities/local.entity.js";
import { LocalDao } from "../../../../src/app_platform/local/daos/local.dao.js";
import { LocalService } from "../../../../src/app_platform/local/services/local.service.js";
import { CashSession } from "../../../../src/commerce/cash/entities/cash-session.entity.js";
import { CashSessionDao } from "../../../../src/commerce/cash/daos/cash-session.dao.js";
import { CashMovement } from "../../../../src/commerce/cash/entities/cash-movement.entity.js";
import { CashMovementDao } from "../../../../src/commerce/cash/daos/cash-movement.dao.js";
import { CashService } from "../../../../src/commerce/cash/services/cash.service.js";
import { effectivePermissions } from "../../../../src/identity/authz/permissions.js";
import { User } from "../../../../src/identity/auth/entities/user.entity.js";
import { UserDao } from "../../../../src/identity/auth/daos/user.dao.js";
import { ServiceType } from "../../../../src/commerce/service-types/entities/service-type.entity.js";
import { ServiceTypeDao } from "../../../../src/commerce/service-types/daos/service-type.dao.js";
import { Customer } from "../../../../src/commerce/customers/entities/customer.entity.js";
import { CustomerDao } from "../../../../src/commerce/customers/daos/customer.dao.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";
import { ensureFixtureTenant } from "../../../support/tenant-fixture.subscriber.js";
import { makeDiscountCapService, makeUserRoleDao, makeAuditLogStub } from "../../../support/authz-deps.js";

describe("SaleService.create", () => {
  let inventoryService: InventoryService;
  let saleService: SaleService;
  let localService: LocalService;
  let cashService: CashService;
  let cashSessionDao: CashSessionDao;
  let serviceTypeDao: ServiceTypeDao;
  let salePaymentDao: SalePaymentDao;
  const tenantId = `${Date.now()}2`;

  beforeAll(async () => {
    await AppDataSource.initialize();
    await ensureFixtureTenant(AppDataSource, tenantId);
    const itemDao = new InventoryItemDao(AppDataSource.getRepository(InventoryItem));
    const movementDao = new InventoryMovementDao(AppDataSource.getRepository(InventoryMovement));
    const reservationDao = new InventoryReservationDao(
      AppDataSource.getRepository(InventoryReservation),
    );
    inventoryService = new InventoryService(itemDao, movementDao, reservationDao);
    localService = new LocalService(new LocalDao(AppDataSource.getRepository(Local)));
    cashSessionDao = new CashSessionDao(AppDataSource.getRepository(CashSession));
    cashService = new CashService(
      cashSessionDao,
      new CashMovementDao(AppDataSource.getRepository(CashMovement)),
      localService,
      new UserDao(AppDataSource.getRepository(User)),
      makeUserRoleDao(), makeAuditLogStub(),
    );
    serviceTypeDao = new ServiceTypeDao(AppDataSource.getRepository(ServiceType));
    salePaymentDao = new SalePaymentDao(AppDataSource.getRepository(SalePayment));
    saleService = new SaleService(
      new SaleDao(AppDataSource.getRepository(Sale)),
      new SaleItemDao(AppDataSource.getRepository(SaleItem)),
      salePaymentDao,
      inventoryService,
      localService,
      cashSessionDao,
      serviceTypeDao,
      new CustomerDao(AppDataSource.getRepository(Customer)),
      makeDiscountCapService(),
      new InventoryItemDao(AppDataSource.getRepository(InventoryItem)),
      new PriceListDao(AppDataSource.getRepository(PriceListItem)),
    );

    // Tasa de impuesto en 0 para que estas pruebas se centren en atomicidad
    // e idempotencia, no en el cálculo de impuesto (ese tiene su propia
    // prueba en calculate-sale-totals.test.ts).
    await runWithTenant(tenantId, async () => {
      const local = await localService.getConfig();
      await localService.updateConfig({ ...local, taxRatePercent: 0 });
    });
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  // Solo puede haber una sesión de caja abierta por local -- cada prueba
  // cierra la suya al terminar para no chocar con la siguiente (mismo
  // tenant, mismo local, por simplicidad de la configuración de impuesto/
  // descuento compartida en beforeAll).
  const openSession = () => runWithTenant(tenantId, () => cashService.openSession("1", 0));
  const owner = {
    userId: "1",
    roles: ["owner"],
    permissions: effectivePermissions(["owner"], false),
  };
  const closeSession = (id: string) =>
    runWithTenant(
      tenantId,
      async () => {
        const session = await cashSessionDao.findById(id);
        const cash = (await cashService.getSummary(id))!.byMethod.efectivo!;
        const expectedCashBalance = new Decimal(session!.openingBalance)
          .plus(cash.income)
          .minus(cash.expense);
        return cashService.closeSession(id, expectedCashBalance.toNumber());
      },
      null,
      owner,
    );

  it("rolls back the whole sale when one item lacks stock", async () => {
    const session = await openSession();
    const itemWithStock = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: "1",
        name: "Funda",
        sku: "FUNDA-1",
        kind: "accessory",
        costPrice: 20,
        salePrice: 50,
        minStock: 0,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({
        inventoryItemId: itemWithStock.id,
        type: "in",
        quantity: 5,
      }),
    );

    const itemOutOfStock = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: "1",
        name: "Cargador",
        sku: "CARGADOR-1",
        kind: "accessory",
        costPrice: 30,
        salePrice: 80,
        minStock: 0,
      }),
    );
    // Sin stock (quantityOnHand = 0).

    await expect(
      runWithTenant(tenantId, () =>
        saleService.create(
          {
            localId: "1",
            cashSessionId: session.id,
            payments: [{ method: "efectivo", amount: 180 }],
            items: [
              {
                lineType: "inventory_item",
                referenceId: itemWithStock.id,
                quantity: 2,
                unitPrice: 50,
              },
              {
                lineType: "inventory_item",
                referenceId: itemOutOfStock.id,
                quantity: 1,
                unitPrice: 80,
              },
            ],
          },
          ["owner"],
        ),
      ),
    ).rejects.toThrow();

    const stockAfterFailure = await runWithTenant(tenantId, () =>
      inventoryService.getById(itemWithStock.id),
    );
    expect(stockAfterFailure?.quantityOnHand).toBe(5);
    await closeSession(session.id);
  });

  it("commits sale, items, payment and stock decrements together, with folio and totals from the pricing engine", async () => {
    const session = await openSession();
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: "1",
        name: "Mica",
        sku: "MICA-1",
        kind: "accessory",
        costPrice: 10,
        salePrice: 30,
        minStock: 0,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 3 }),
    );

    const sale = await runWithTenant(tenantId, () =>
      saleService.create(
        {
          localId: "1",
          cashSessionId: session.id,
          payments: [{ method: "tarjeta", amount: 60 }],
          items: [{ lineType: "inventory_item", referenceId: item.id, quantity: 2, unitPrice: 30 }],
        },
        ["owner"],
      ),
    );

    expect(Number(sale.totalValue)).toBe(60);
    expect(Number(sale.subtotal)).toBe(60);
    expect(sale.saleNumber).toBeGreaterThan(0);
    const stock = await runWithTenant(tenantId, () => inventoryService.getById(item.id));
    expect(stock?.quantityOnHand).toBe(1);
    const items = await runWithTenant(tenantId, () => saleService.getItems(sale.id));
    expect(items).toHaveLength(1);
    expect(items[0].lineType).toBe("inventory_item");
    expect(items[0].referenceId).toBe(item.id);

    const payments = await runWithTenant(tenantId, () => salePaymentDao.findBySaleId(sale.id));
    expect(payments).toHaveLength(1);
    expect(payments[0].method).toBe("tarjeta");
    expect(Number(payments[0].amount)).toBe(60);
    await closeSession(session.id);
  });

  it("splits a sale across two payment methods when they sum exactly to the total", async () => {
    const session = await openSession();
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: "1",
        name: "Funda split",
        sku: "FUNDA-SPLIT",
        kind: "accessory",
        costPrice: 10,
        salePrice: 60,
        minStock: 0,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 2 }),
    );

    const sale = await runWithTenant(tenantId, () =>
      saleService.create(
        {
          localId: "1",
          cashSessionId: session.id,
          payments: [
            { method: "efectivo", amount: 30 },
            { method: "tarjeta", amount: 30 },
          ],
          items: [{ lineType: "inventory_item", referenceId: item.id, quantity: 1, unitPrice: 60 }],
        },
        ["owner"],
      ),
    );

    const payments = await runWithTenant(tenantId, () => salePaymentDao.findBySaleId(sale.id));
    expect(payments).toHaveLength(2);
    expect(payments.map((p) => p.method).sort()).toEqual(["efectivo", "tarjeta"]);
    expect(payments.reduce((sum, p) => sum + Number(p.amount), 0)).toBe(60);
    await closeSession(session.id);
  });

  it("rejects a sale when the payments don't add up to the total, and inserts nothing", async () => {
    const session = await openSession();
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: "1",
        name: "Funda split mal",
        sku: "FUNDA-SPLIT-BAD",
        kind: "accessory",
        costPrice: 10,
        salePrice: 60,
        minStock: 0,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 2 }),
    );

    await expect(
      runWithTenant(tenantId, () =>
        saleService.create(
          {
            localId: "1",
            cashSessionId: session.id,
            payments: [
              { method: "efectivo", amount: 30 },
              { method: "tarjeta", amount: 29 },
            ],
            items: [
              { lineType: "inventory_item", referenceId: item.id, quantity: 1, unitPrice: 60 },
            ],
          },
          ["owner"],
        ),
      ),
    ).rejects.toThrow("La suma de los pagos no coincide con el total de la venta");

    const stock = await runWithTenant(tenantId, () => inventoryService.getById(item.id));
    expect(stock?.quantityOnHand).toBe(2); // nada se descontó
    await closeSession(session.id);
  });

  it("stores the provider reference and authorization code captured by hand for a card payment", async () => {
    const session = await openSession();
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: "1",
        name: "Funda tarjeta",
        sku: "FUNDA-CARD",
        kind: "accessory",
        costPrice: 10,
        salePrice: 40,
        minStock: 0,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 1 }),
    );

    const sale = await runWithTenant(tenantId, () =>
      saleService.create(
        {
          localId: "1",
          cashSessionId: session.id,
          payments: [
            {
              method: "tarjeta",
              amount: 40,
              providerReference: "TERM-REF-001",
              providerAuthorizationCode: "AUTH123",
            },
          ],
          items: [{ lineType: "inventory_item", referenceId: item.id, quantity: 1, unitPrice: 40 }],
        },
        ["owner"],
      ),
    );

    const payments = await runWithTenant(tenantId, () => salePaymentDao.findBySaleId(sale.id));
    expect(payments[0].providerReference).toBe("TERM-REF-001");
    expect(payments[0].providerAuthorizationCode).toBe("AUTH123");
    await closeSession(session.id);
  });

  it("sells a service line (no stock) alongside an inventory item in the same sale", async () => {
    const session = await openSession();
    const part = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: "1",
        name: "Batería genérica",
        sku: "BAT-GEN",
        kind: "part",
        costPrice: 100,
        salePrice: 200,
        minStock: 0,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({ inventoryItemId: part.id, type: "in", quantity: 2 }),
    );
    const serviceType = await runWithTenant(tenantId, () =>
      serviceTypeDao.create({ name: "Instalación" }),
    );

    const sale = await runWithTenant(tenantId, () =>
      saleService.create(
        {
          localId: "1",
          cashSessionId: session.id,
          payments: [{ method: "efectivo", amount: 250 }],
          items: [
            { lineType: "inventory_item", referenceId: part.id, quantity: 1, unitPrice: 200 },
            { lineType: "service_type", referenceId: serviceType.id, quantity: 1, unitPrice: 50 },
          ],
        },
        ["owner"],
      ),
    );

    expect(Number(sale.totalValue)).toBe(250);
    const stock = await runWithTenant(tenantId, () => inventoryService.getById(part.id));
    expect(stock?.quantityOnHand).toBe(1);
    const items = await runWithTenant(tenantId, () => saleService.getItems(sale.id));
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.lineType).sort()).toEqual(["inventory_item", "service_type"]);
    await closeSession(session.id);
  });

  it("rejects a sale with a service_type reference that doesn't exist in the tenant", async () => {
    const session = await openSession();
    await expect(
      runWithTenant(tenantId, () =>
        saleService.create(
          {
            localId: "1",
            cashSessionId: session.id,
            payments: [{ method: "efectivo", amount: 10 }],
            items: [
              { lineType: "service_type", referenceId: "999999", quantity: 1, unitPrice: 10 },
            ],
          },
          ["owner"],
        ),
      ),
    ).rejects.toThrow("Tipo de servicio no encontrado");
    await closeSession(session.id);
  });

  it("rejects a sale without an open cash session for that local", async () => {
    const unknownSessionId = "999999";
    await expect(
      runWithTenant(tenantId, () =>
        saleService.create(
          {
            localId: "1",
            cashSessionId: unknownSessionId,
            payments: [{ method: "efectivo", amount: 10 }],
            items: [{ lineType: "inventory_item", referenceId: "1", quantity: 1, unitPrice: 10 }],
          },
          ["owner"],
        ),
      ),
    ).rejects.toThrow("Sesión de caja no encontrada");
  });

  it("is idempotent: the same idempotencyKey never creates a second sale nor a second payment", async () => {
    const session = await openSession();
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: "1",
        name: "Cable",
        sku: "CABLE-IDEMP",
        kind: "accessory",
        costPrice: 5,
        salePrice: 15,
        minStock: 0,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 10 }),
    );

    const payload = {
      localId: "1",
      cashSessionId: session.id,
      payments: [{ method: "efectivo" as const, amount: 15 }],
      idempotencyKey: "double-click-key-1",
      items: [
        { lineType: "inventory_item" as const, referenceId: item.id, quantity: 1, unitPrice: 15 },
      ],
    };

    const first = await runWithTenant(tenantId, () => saleService.create(payload, ["owner"]));
    const second = await runWithTenant(tenantId, () => saleService.create(payload, ["owner"]));

    expect(second.id).toBe(first.id);
    const stock = await runWithTenant(tenantId, () => inventoryService.getById(item.id));
    expect(stock?.quantityOnHand).toBe(9); // solo se descontó una vez, no dos
    const payments = await runWithTenant(tenantId, () => salePaymentDao.findBySaleId(first.id));
    expect(payments).toHaveLength(1);
    await closeSession(session.id);
  });

  it("rejects a cashier's line discount above the tenant's cap for that role", async () => {
    const session = await openSession();
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: "1",
        name: "Funda con descuento",
        sku: "FUNDA-DESC",
        kind: "accessory",
        costPrice: 10,
        salePrice: 50,
        minStock: 0,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 5 }),
    );

    // Sin tope fijado por el dueño en la sucursal, el cajero no puede dar descuento.
    await expect(
      runWithTenant(tenantId, () =>
        saleService.create(
          {
            localId: "1",
            cashSessionId: session.id,
            payments: [{ method: "efectivo", amount: 25 }],
            items: [
              {
                lineType: "inventory_item",
                referenceId: item.id,
                quantity: 1,
                unitPrice: 50,
                discountPercent: 50,
              },
            ],
          },
          ["cashier"],
        ),
      ),
    ).rejects.toThrow("supera el límite permitido");

    // El mismo descuento sí lo puede aplicar el dueño: no tiene tope.
    const sale = await runWithTenant(tenantId, () =>
      saleService.create(
        {
          localId: "1",
          cashSessionId: session.id,
          payments: [{ method: "efectivo", amount: 25 }],
          items: [
            {
              lineType: "inventory_item",
              referenceId: item.id,
              quantity: 1,
              unitPrice: 50,
              discountPercent: 50,
            },
          ],
        },
        ["owner"],
      ),
    );
    expect(Number(sale.totalValue)).toBe(25);
  });
});
