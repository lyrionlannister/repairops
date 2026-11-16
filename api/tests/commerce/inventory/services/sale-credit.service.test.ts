import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { InventoryItem } from "../../../../src/commerce/inventory/entities/inventory-item.entity.js";
import { InventoryMovement } from "../../../../src/commerce/inventory/entities/inventory-movement.entity.js";
import { Sale } from "../../../../src/commerce/inventory/entities/sale.entity.js";
import { SaleItem } from "../../../../src/commerce/inventory/entities/sale-item.entity.js";
import { InventoryItemDao } from "../../../../src/commerce/inventory/daos/inventory-item.dao.js";
import { InventoryMovementDao } from "../../../../src/commerce/inventory/daos/inventory-movement.dao.js";
import { SaleDao } from "../../../../src/commerce/inventory/daos/sale.dao.js";
import { SaleItemDao } from "../../../../src/commerce/inventory/daos/sale-item.dao.js";
import { SalePayment } from "../../../../src/commerce/payments/entities/sale-payment.entity.js";
import { SalePaymentDao } from "../../../../src/commerce/payments/daos/sale-payment.dao.js";
import { InventoryReservation } from "../../../../src/commerce/inventory/entities/inventory-reservation.entity.js";
import { InventoryReservationDao } from "../../../../src/commerce/inventory/daos/inventory-reservation.dao.js";
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
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

describe("SaleService.create: credito con limite (Fase 5, Rama Cliente)", () => {
  let inventoryService: InventoryService;
  let saleService: SaleService;
  let customerDao: CustomerDao;
  let openSessionHelper: (localId: string) => Promise<{ id: string }>;
  const tenantId = `${Date.now()}8`;

  beforeAll(async () => {
    await AppDataSource.initialize();
    const itemDao = new InventoryItemDao(AppDataSource.getRepository(InventoryItem));
    const movementDao = new InventoryMovementDao(AppDataSource.getRepository(InventoryMovement));
    const reservationDao = new InventoryReservationDao(AppDataSource.getRepository(InventoryReservation));
    inventoryService = new InventoryService(itemDao, movementDao, reservationDao);
    const localService = new LocalService(new LocalDao(AppDataSource.getRepository(Local)));
    const cashSessionDao = new CashSessionDao(AppDataSource.getRepository(CashSession));
    const cashService = new CashService(
      cashSessionDao,
      new CashMovementDao(AppDataSource.getRepository(CashMovement)),
      localService,
      new UserDao(AppDataSource.getRepository(User)),
    );
    customerDao = new CustomerDao(AppDataSource.getRepository(Customer));
    saleService = new SaleService(
      new SaleDao(AppDataSource.getRepository(Sale)),
      new SaleItemDao(AppDataSource.getRepository(SaleItem)),
      new SalePaymentDao(AppDataSource.getRepository(SalePayment)),
      inventoryService,
      localService,
      cashSessionDao,
      new ServiceTypeDao(AppDataSource.getRepository(ServiceType)),
      customerDao,
    );

    await runWithTenant(tenantId, async () => {
      const local = await localService.getConfig();
      await localService.updateConfig({ ...local, taxRatePercent: 0 });
    });
    openSessionHelper = (localId: string) => runWithTenant(tenantId, () => cashService.openSession(localId, 0));
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  const makeItem = async (sku: string, localId: string) =>
    runWithTenant(tenantId, () =>
      inventoryService.create({ localId, name: `Item ${sku}`, sku, kind: "accessory", costPrice: 10, salePrice: 100, minStock: 0 }),
    );

  it("accepts a credit sale within the customer's limit", async () => {
    const session = await openSessionHelper("1");
    const item = await makeItem("CRED-OK", "1");
    await runWithTenant(tenantId, () => inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 5 }));
    const customer = await runWithTenant(tenantId, () => customerDao.create({ name: "Cliente Credito", phone: "555", creditLimit: 200 }));

    const sale = await runWithTenant(tenantId, () =>
      saleService.create(
        { localId: "1", cashSessionId: session.id, customerId: customer.id, payments: [{ method: "credito", amount: 100 }], items: [{ lineType: "inventory_item", referenceId: item.id, quantity: 1, unitPrice: 100 }] },
        "owner",
      ),
    );
    expect(Number(sale.totalValue)).toBe(100);
  });

  it("rejects a credit sale that exceeds the customer's limit, and inserts nothing", async () => {
    const session = await openSessionHelper("2");
    const item = await makeItem("CRED-OVER", "2");
    await runWithTenant(tenantId, () => inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 5 }));
    const customer = await runWithTenant(tenantId, () => customerDao.create({ name: "Cliente Limite", phone: "555", creditLimit: 50 }));

    await expect(
      runWithTenant(tenantId, () =>
        saleService.create(
          { localId: "2", cashSessionId: session.id, customerId: customer.id, payments: [{ method: "credito", amount: 100 }], items: [{ lineType: "inventory_item", referenceId: item.id, quantity: 1, unitPrice: 100 }] },
          "owner",
        ),
      ),
    ).rejects.toThrow("supera el límite disponible");

    const stock = await runWithTenant(tenantId, () => inventoryService.getById(item.id));
    expect(stock?.quantityOnHand).toBe(5); // nada se descontó
  });

  it("rejects a credit sale without a customer", async () => {
    const session = await openSessionHelper("3");
    const item = await makeItem("CRED-NOCUST", "3");
    await runWithTenant(tenantId, () => inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 5 }));

    await expect(
      runWithTenant(tenantId, () =>
        saleService.create(
          { localId: "3", cashSessionId: session.id, payments: [{ method: "credito", amount: 100 }], items: [{ lineType: "inventory_item", referenceId: item.id, quantity: 1, unitPrice: 100 }] },
          "owner",
        ),
      ),
    ).rejects.toThrow("requiere un cliente");
  });

  it("accumulates the balance across sales: a second credit sale is rejected once the first already used the limit", async () => {
    const session = await openSessionHelper("4");
    const item = await makeItem("CRED-ACC", "4");
    await runWithTenant(tenantId, () => inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 5 }));
    const customer = await runWithTenant(tenantId, () => customerDao.create({ name: "Cliente Acumula", phone: "555", creditLimit: 150 }));

    await runWithTenant(tenantId, () =>
      saleService.create(
        { localId: "4", cashSessionId: session.id, customerId: customer.id, payments: [{ method: "credito", amount: 100 }], items: [{ lineType: "inventory_item", referenceId: item.id, quantity: 1, unitPrice: 100 }] },
        "owner",
      ),
    );

    await expect(
      runWithTenant(tenantId, () =>
        saleService.create(
          { localId: "4", cashSessionId: session.id, customerId: customer.id, payments: [{ method: "credito", amount: 100 }], items: [{ lineType: "inventory_item", referenceId: item.id, quantity: 1, unitPrice: 100 }] },
          "owner",
        ),
      ),
    ).rejects.toThrow("supera el límite disponible");
  });
});
