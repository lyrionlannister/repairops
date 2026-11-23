import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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
import { User } from "../../../../src/identity/auth/entities/user.entity.js";
import { UserDao } from "../../../../src/identity/auth/daos/user.dao.js";
import { ServiceType } from "../../../../src/commerce/service-types/entities/service-type.entity.js";
import { ServiceTypeDao } from "../../../../src/commerce/service-types/daos/service-type.dao.js";
import { Customer } from "../../../../src/commerce/customers/entities/customer.entity.js";
import { CustomerDao } from "../../../../src/commerce/customers/daos/customer.dao.js";
import { Return } from "../../../../src/commerce/returns/entities/return.entity.js";
import { ReturnItem } from "../../../../src/commerce/returns/entities/return-item.entity.js";
import { ReturnDao } from "../../../../src/commerce/returns/daos/return.dao.js";
import { ReturnItemDao } from "../../../../src/commerce/returns/daos/return-item.dao.js";
import { ReturnService } from "../../../../src/commerce/returns/services/return.service.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";
import { ensureFixtureTenant } from "../../../support/tenant-fixture.subscriber.js";
import { makeDiscountCapService, makeUserRoleDao } from "../../../support/authz-deps.js";

describe("ReturnService.create", () => {
  let inventoryService: InventoryService;
  let saleService: SaleService;
  let returnService: ReturnService;
  let localService: LocalService;
  let cashService: CashService;
  let cashMovementDao: CashMovementDao;
  let serviceTypeDao: ServiceTypeDao;
  const tenantId = `${Date.now()}3`;

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
    const cashSessionDao = new CashSessionDao(AppDataSource.getRepository(CashSession));
    cashMovementDao = new CashMovementDao(AppDataSource.getRepository(CashMovement));
    cashService = new CashService(
      cashSessionDao,
      cashMovementDao,
      localService,
      new UserDao(AppDataSource.getRepository(User)),
      makeUserRoleDao(),
    );
    serviceTypeDao = new ServiceTypeDao(AppDataSource.getRepository(ServiceType));
    const saleDao = new SaleDao(AppDataSource.getRepository(Sale));
    const saleItemDao = new SaleItemDao(AppDataSource.getRepository(SaleItem));
    saleService = new SaleService(
      saleDao,
      saleItemDao,
      new SalePaymentDao(AppDataSource.getRepository(SalePayment)),
      inventoryService,
      localService,
      cashSessionDao,
      serviceTypeDao,
      new CustomerDao(AppDataSource.getRepository(Customer)),
      makeDiscountCapService(),
      new InventoryItemDao(AppDataSource.getRepository(InventoryItem)),
      new PriceListDao(AppDataSource.getRepository(PriceListItem)),
    );
    returnService = new ReturnService(
      new ReturnDao(AppDataSource.getRepository(Return)),
      new ReturnItemDao(AppDataSource.getRepository(ReturnItem)),
      saleDao,
      saleItemDao,
      cashSessionDao,
      inventoryService,
      localService,
    );

    await runWithTenant(tenantId, async () => {
      const local = await localService.getConfig();
      await localService.updateConfig({ ...local, taxRatePercent: 0 });
    });
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  // Cada test abre su sesion en un localId distinto -- Return registra un
  // CashMovement real (a diferencia de Sale, que no toca caja), asi que
  // cerrar la sesion exigiria cuadrar la varianza; mas simple no compartir
  // localId entre tests que no necesitan cerrar nada.
  const openSession = (localId: string) =>
    runWithTenant(tenantId, () => cashService.openSession(localId, 0));

  it("reverts stock for an inventory line and registers the refund as a cash expense", async () => {
    const session = await openSession("1");
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: "1",
        name: "Funda R1",
        sku: "FUNDA-R1",
        kind: "accessory",
        costPrice: 10,
        salePrice: 30,
        minStock: 0,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 5 }),
    );

    const sale = await runWithTenant(tenantId, () =>
      saleService.create(
        {
          localId: "1",
          cashSessionId: session.id,
          payments: [{ method: "efectivo", amount: 60 }],
          items: [{ lineType: "inventory_item", referenceId: item.id, quantity: 2, unitPrice: 30 }],
        },
        ["owner"],
      ),
    );
    const saleItems = await runWithTenant(tenantId, () => saleService.getItems(sale.id));

    const stockAfterSale = await runWithTenant(tenantId, () => inventoryService.getById(item.id));
    expect(stockAfterSale?.quantityOnHand).toBe(3);

    const theReturn = await runWithTenant(tenantId, () =>
      returnService.create({
        saleId: sale.id,
        cashSessionId: session.id,
        refundMethod: "efectivo",
        reason: "Cliente se arrepintió",
        totalRefunded: 30,
        items: [{ saleItemId: saleItems[0].id, quantity: 1, refundAmount: 30 }],
      }),
    );

    expect(theReturn.returnNumber).toBeGreaterThan(0);
    const stockAfterReturn = await runWithTenant(tenantId, () => inventoryService.getById(item.id));
    expect(stockAfterReturn?.quantityOnHand).toBe(4);

    const movements = await runWithTenant(tenantId, () =>
      cashMovementDao.findBySession(session.id),
    );
    const expense = movements.find(
      (m) => m.relatedEntityType === "return" && m.relatedEntityId === theReturn.id,
    );
    expect(expense).toBeDefined();
    expect(expense?.type).toBe("expense");
    expect(Number(expense?.amount)).toBe(30);
  });

  it("does not create an inventory movement when returning a service_type line", async () => {
    const session = await openSession("2");
    const serviceType = await runWithTenant(tenantId, () =>
      serviceTypeDao.create({ name: "Instalación R" }),
    );
    const sale = await runWithTenant(tenantId, () =>
      saleService.create(
        {
          localId: "2",
          cashSessionId: session.id,
          payments: [{ method: "efectivo", amount: 50 }],
          items: [
            { lineType: "service_type", referenceId: serviceType.id, quantity: 1, unitPrice: 50 },
          ],
        },
        ["owner"],
      ),
    );
    const saleItems = await runWithTenant(tenantId, () => saleService.getItems(sale.id));

    const theReturn = await runWithTenant(tenantId, () =>
      returnService.create({
        saleId: sale.id,
        cashSessionId: session.id,
        refundMethod: "efectivo",
        reason: "No se realizó el servicio",
        totalRefunded: 50,
        items: [{ saleItemId: saleItems[0].id, quantity: 1, refundAmount: 50 }],
      }),
    );

    const items = await runWithTenant(tenantId, () => returnService.getItems(theReturn.id));
    expect(items).toHaveLength(1);
  });

  it("rejects returning more than what remains available, and persists nothing", async () => {
    const session = await openSession("3");
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: "1",
        name: "Funda R2",
        sku: "FUNDA-R2",
        kind: "accessory",
        costPrice: 10,
        salePrice: 30,
        minStock: 0,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 5 }),
    );
    const sale = await runWithTenant(tenantId, () =>
      saleService.create(
        {
          localId: "3",
          cashSessionId: session.id,
          payments: [{ method: "efectivo", amount: 30 }],
          items: [{ lineType: "inventory_item", referenceId: item.id, quantity: 1, unitPrice: 30 }],
        },
        ["owner"],
      ),
    );
    const saleItems = await runWithTenant(tenantId, () => saleService.getItems(sale.id));

    await expect(
      runWithTenant(tenantId, () =>
        returnService.create({
          saleId: sale.id,
          cashSessionId: session.id,
          refundMethod: "efectivo",
          reason: "Exceso",
          totalRefunded: 60,
          items: [{ saleItemId: saleItems[0].id, quantity: 2, refundAmount: 60 }],
        }),
      ),
    ).rejects.toThrow("excede lo disponible");

    const stock = await runWithTenant(tenantId, () => inventoryService.getById(item.id));
    expect(stock?.quantityOnHand).toBe(4); // nada se revirtió
  });

  it("rejects a second return once the line is fully returned", async () => {
    const session = await openSession("4");
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: "1",
        name: "Funda R3",
        sku: "FUNDA-R3",
        kind: "accessory",
        costPrice: 10,
        salePrice: 30,
        minStock: 0,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 5 }),
    );
    const sale = await runWithTenant(tenantId, () =>
      saleService.create(
        {
          localId: "4",
          cashSessionId: session.id,
          payments: [{ method: "efectivo", amount: 30 }],
          items: [{ lineType: "inventory_item", referenceId: item.id, quantity: 1, unitPrice: 30 }],
        },
        ["owner"],
      ),
    );
    const saleItems = await runWithTenant(tenantId, () => saleService.getItems(sale.id));

    await runWithTenant(tenantId, () =>
      returnService.create({
        saleId: sale.id,
        cashSessionId: session.id,
        refundMethod: "efectivo",
        reason: "Primera devolución",
        totalRefunded: 30,
        items: [{ saleItemId: saleItems[0].id, quantity: 1, refundAmount: 30 }],
      }),
    );

    await expect(
      runWithTenant(tenantId, () =>
        returnService.create({
          saleId: sale.id,
          cashSessionId: session.id,
          refundMethod: "efectivo",
          reason: "Segunda devolución, ya no queda nada",
          totalRefunded: 30,
          items: [{ saleItemId: saleItems[0].id, quantity: 1, refundAmount: 30 }],
        }),
      ),
    ).rejects.toThrow("excede lo disponible");
  });

  it("rejects when the sum of line refundAmounts doesn't match totalRefunded", async () => {
    const session = await openSession("5");
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: "1",
        name: "Funda R4",
        sku: "FUNDA-R4",
        kind: "accessory",
        costPrice: 10,
        salePrice: 30,
        minStock: 0,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 5 }),
    );
    const sale = await runWithTenant(tenantId, () =>
      saleService.create(
        {
          localId: "5",
          cashSessionId: session.id,
          payments: [{ method: "efectivo", amount: 30 }],
          items: [{ lineType: "inventory_item", referenceId: item.id, quantity: 1, unitPrice: 30 }],
        },
        ["owner"],
      ),
    );
    const saleItems = await runWithTenant(tenantId, () => saleService.getItems(sale.id));

    await expect(
      runWithTenant(tenantId, () =>
        returnService.create({
          saleId: sale.id,
          cashSessionId: session.id,
          refundMethod: "efectivo",
          reason: "Monto mal",
          totalRefunded: 29,
          items: [{ saleItemId: saleItems[0].id, quantity: 1, refundAmount: 30 }],
        }),
      ),
    ).rejects.toThrow("no coincide con el total a reembolsar");
  });

  it("is idempotent: the same idempotencyKey never creates a second return nor reverts stock twice", async () => {
    const session = await openSession("6");
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: "1",
        name: "Funda R5",
        sku: "FUNDA-R5",
        kind: "accessory",
        costPrice: 10,
        salePrice: 30,
        minStock: 0,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 5 }),
    );
    const sale = await runWithTenant(tenantId, () =>
      saleService.create(
        {
          localId: "6",
          cashSessionId: session.id,
          payments: [{ method: "efectivo", amount: 30 }],
          items: [{ lineType: "inventory_item", referenceId: item.id, quantity: 1, unitPrice: 30 }],
        },
        ["owner"],
      ),
    );
    const saleItems = await runWithTenant(tenantId, () => saleService.getItems(sale.id));

    const payload = {
      saleId: sale.id,
      cashSessionId: session.id,
      refundMethod: "efectivo" as const,
      reason: "Doble clic",
      totalRefunded: 30,
      idempotencyKey: "return-double-click-1",
      items: [{ saleItemId: saleItems[0].id, quantity: 1, refundAmount: 30 }],
    };

    const first = await runWithTenant(tenantId, () => returnService.create(payload));
    const second = await runWithTenant(tenantId, () => returnService.create(payload));
    expect(second.id).toBe(first.id);

    const stock = await runWithTenant(tenantId, () => inventoryService.getById(item.id));
    expect(stock?.quantityOnHand).toBe(5); // solo se revirtio una vez
  });

  it("rejects a return whose saleId belongs to a different tenant (tenant isolation)", async () => {
    const otherTenantId = `${Date.now()}4`;
    await ensureFixtureTenant(AppDataSource, otherTenantId);
    const sessionA = await openSession("7");
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: "1",
        name: "Funda tenant A",
        sku: "FUNDA-TA",
        kind: "accessory",
        costPrice: 10,
        salePrice: 30,
        minStock: 0,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 5 }),
    );
    const saleOfTenantA = await runWithTenant(tenantId, () =>
      saleService.create(
        {
          localId: "7",
          cashSessionId: sessionA.id,
          payments: [{ method: "efectivo", amount: 30 }],
          items: [{ lineType: "inventory_item", referenceId: item.id, quantity: 1, unitPrice: 30 }],
        },
        ["owner"],
      ),
    );
    const saleItemsA = await runWithTenant(tenantId, () => saleService.getItems(saleOfTenantA.id));

    await runWithTenant(otherTenantId, async () => {
      const local = await localService.getConfig();
      await localService.updateConfig({ ...local, taxRatePercent: 0 });
    });
    const sessionB = await runWithTenant(otherTenantId, () => cashService.openSession("1", 0));

    await expect(
      runWithTenant(otherTenantId, () =>
        returnService.create({
          saleId: saleOfTenantA.id,
          cashSessionId: sessionB.id,
          refundMethod: "efectivo",
          reason: "Intento cross-tenant",
          totalRefunded: 30,
          items: [{ saleItemId: saleItemsA[0].id, quantity: 1, refundAmount: 30 }],
        }),
      ),
    ).rejects.toThrow("Venta no encontrada");
  });
});
