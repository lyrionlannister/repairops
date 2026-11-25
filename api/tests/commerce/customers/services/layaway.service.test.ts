import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { ensureFixtureBranch } from "../../../support/tenant-fixture.subscriber.js";
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
import { Customer } from "../../../../src/commerce/customers/entities/customer.entity.js";
import { CustomerDao } from "../../../../src/commerce/customers/daos/customer.dao.js";
import { Layaway } from "../../../../src/commerce/customers/entities/layaway.entity.js";
import { LayawayItem } from "../../../../src/commerce/customers/entities/layaway-item.entity.js";
import { LayawayDao } from "../../../../src/commerce/customers/daos/layaway.dao.js";
import { LayawayItemDao } from "../../../../src/commerce/customers/daos/layaway-item.dao.js";
import { LayawayService } from "../../../../src/commerce/customers/services/layaway.service.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";
import { makeUserRoleDao, makeAuditLogStub } from "../../../support/authz-deps.js";

describe("LayawayService", () => {
  let inventoryService: InventoryService;
  let layawayService: LayawayService;
  let customerDao: CustomerDao;
  let cashMovementDao: CashMovementDao;
  let openSessionHelper: (localId: string) => Promise<{ id: string; localId: string }>;
  const tenantId = `${Date.now()}9`;

  beforeAll(async () => {
    await AppDataSource.initialize();
    const itemDao = new InventoryItemDao(AppDataSource.getRepository(InventoryItem));
    const movementDao = new InventoryMovementDao(AppDataSource.getRepository(InventoryMovement));
    const reservationDao = new InventoryReservationDao(
      AppDataSource.getRepository(InventoryReservation),
    );
    inventoryService = new InventoryService(itemDao, movementDao, reservationDao);
    const reservationService = new InventoryReservationService(reservationDao, inventoryService);
    const localService = new LocalService(new LocalDao(AppDataSource.getRepository(Local)));
    const cashSessionDao = new CashSessionDao(AppDataSource.getRepository(CashSession));
    cashMovementDao = new CashMovementDao(AppDataSource.getRepository(CashMovement));
    const cashService = new CashService(
      cashSessionDao,
      cashMovementDao,
      localService,
      new UserDao(AppDataSource.getRepository(User)),
      makeUserRoleDao(),
      makeAuditLogStub(),
    );
    customerDao = new CustomerDao(AppDataSource.getRepository(Customer));
    layawayService = new LayawayService(
      new LayawayDao(AppDataSource.getRepository(Layaway)),
      new LayawayItemDao(AppDataSource.getRepository(LayawayItem)),
      customerDao,
      cashSessionDao,
      itemDao,
      reservationService,
      new PriceListDao(AppDataSource.getRepository(PriceListItem)),
      new LocalService(new LocalDao(AppDataSource.getRepository(Local))),
    );
    openSessionHelper = (localId: string) =>
      runWithTenant(tenantId, () => cashService.openSession(localId, 0));
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  const makeItem = async (sku: string, localId: string, stock: number) => {
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId,
        name: `Item ${sku}`,
        sku,
        kind: "accessory",
        costPrice: 20,
        salePrice: 100,
        minStock: 0,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: stock }),
    );
    return item;
  };

  const futureDate = () =>
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  // Sucursal propia del tenant de la prueba: los ids fijos ("1".."7") pueden
  // ser sucursales reales de otro tenant en la base de desarrollo.
  const fixtureBranch = async (suffix: string) => {
    const branchId = `${tenantId}${suffix}`.slice(-15);
    await ensureFixtureBranch(AppDataSource, tenantId, branchId);
    return branchId;
  };
  // Tres dias atras: "ayer" en UTC puede seguir siendo "hoy" en la zona del taller.
  const pastDate = () => new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  it("opens a layaway: reserves stock (never decrements) and registers the deposit as a real cash movement", async () => {
    const session = await openSessionHelper("1");
    const item = await makeItem("LAY-OPEN", "1", 5);
    const customer = await runWithTenant(tenantId, () =>
      customerDao.create({ name: "Cliente Apartado", phone: "555" }),
    );

    const layaway = await runWithTenant(tenantId, () =>
      layawayService.open({
        customerId: customer.id,
        cashSessionId: session.id,
        depositAmount: 30,
        depositMethod: "efectivo",
        expiresAt: futureDate(),
        items: [{ inventoryItemId: item.id, quantity: 1, unitPrice: 100 }],
      }),
    );

    expect(layaway.status).toBe("open");
    expect(Number(layaway.totalValue)).toBe(100);
    const stock = await runWithTenant(tenantId, () => inventoryService.getById(item.id));
    expect(stock?.quantityOnHand).toBe(5); // nunca se toca
    const available = await runWithTenant(tenantId, () =>
      inventoryService.getAvailableQuantity(item.id),
    );
    expect(available).toBe(4); // 5 - 1 reservado

    const movements = await runWithTenant(tenantId, () =>
      cashMovementDao.findBySession(session.id),
    );
    const deposit = movements.find(
      (m) => m.relatedEntityType === "layaway" && m.relatedEntityId === layaway.id,
    );
    expect(deposit?.type).toBe("income");
    expect(Number(deposit?.amount)).toBe(30);
  });

  it("never reserves more than the free stock, even with concurrent layaways", async () => {
    const session = await openSessionHelper(await fixtureBranch("11"));
    const item = await makeItem("LAY-OVER", session.localId, 3);
    const customer = await runWithTenant(tenantId, () =>
      customerDao.create({ name: "Cliente Sobreventa", phone: "555" }),
    );
    const open = (quantity: number) =>
      runWithTenant(tenantId, () =>
        layawayService.open({
          customerId: customer.id,
          cashSessionId: session.id,
          depositAmount: 10,
          depositMethod: "efectivo",
          expiresAt: futureDate(),
          items: [{ inventoryItemId: item.id, quantity, unitPrice: 100 }],
        }),
      );

    await expect(open(4)).rejects.toThrow("Solo hay 3 piezas libres");
    const results = await Promise.allSettled([open(2), open(2)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const available = await runWithTenant(tenantId, () =>
      inventoryService.getAvailableQuantity(item.id),
    );
    expect(available).toBe(1);
  });

  it("rejects an expiry date in the past", async () => {
    const session = await openSessionHelper(await fixtureBranch("12"));
    const item = await makeItem("LAY-PAST", session.localId, 3);
    const customer = await runWithTenant(tenantId, () =>
      customerDao.create({ name: "Cliente Pasado", phone: "555" }),
    );
    await expect(
      runWithTenant(tenantId, () =>
        layawayService.open({
          customerId: customer.id,
          cashSessionId: session.id,
          depositAmount: 10,
          depositMethod: "efectivo",
          expiresAt: pastDate(),
          items: [{ inventoryItemId: item.id, quantity: 1, unitPrice: 100 }],
        }),
      ),
    ).rejects.toThrow("no puede ser anterior a hoy");
  });

  it("rejects a deposit greater than the total value", async () => {
    const session = await openSessionHelper("2");
    const item = await makeItem("LAY-OVERDEP", "2", 5);
    const customer = await runWithTenant(tenantId, () =>
      customerDao.create({ name: "Cliente Sobredeposito", phone: "555" }),
    );

    await expect(
      runWithTenant(tenantId, () =>
        layawayService.open({
          customerId: customer.id,
          cashSessionId: session.id,
          depositAmount: 150,
          depositMethod: "efectivo",
          expiresAt: futureDate(),
          items: [{ inventoryItemId: item.id, quantity: 1, unitPrice: 100 }],
        }),
      ),
    ).rejects.toThrow("no puede ser mayor al valor total");
  });

  it("completes a layaway: consumes the reservation (real stock decrement) and registers the final cash movement, never creating a Sale", async () => {
    const session = await openSessionHelper("3");
    const item = await makeItem("LAY-COMPLETE", "3", 5);
    const customer = await runWithTenant(tenantId, () =>
      customerDao.create({ name: "Cliente Completa", phone: "555" }),
    );

    const layaway = await runWithTenant(tenantId, () =>
      layawayService.open({
        customerId: customer.id,
        cashSessionId: session.id,
        depositAmount: 40,
        depositMethod: "efectivo",
        expiresAt: futureDate(),
        items: [{ inventoryItemId: item.id, quantity: 1, unitPrice: 100 }],
      }),
    );

    const completed = await runWithTenant(tenantId, () =>
      layawayService.complete(layaway.id, [{ method: "tarjeta", amount: 60 }], session.id),
    );
    expect(completed.status).toBe("completed");

    const stock = await runWithTenant(tenantId, () => inventoryService.getById(item.id));
    expect(stock?.quantityOnHand).toBe(4); // ahora si, consumido real

    const movements = await runWithTenant(tenantId, () =>
      cashMovementDao.findBySession(session.id),
    );
    const finalPayment = movements.find(
      (m) =>
        m.relatedEntityType === "layaway" &&
        m.relatedEntityId === layaway.id &&
        m.method === "tarjeta",
    );
    expect(Number(finalPayment?.amount)).toBe(60);

    await expect(
      runWithTenant(tenantId, () =>
        layawayService.complete(layaway.id, [{ method: "tarjeta", amount: 60 }], session.id),
      ),
    ).rejects.toThrow("ya está completado");
  });

  it("rejects completing when the final payments don't match the remaining balance", async () => {
    const session = await openSessionHelper("4");
    const item = await makeItem("LAY-BADPAY", "4", 5);
    const customer = await runWithTenant(tenantId, () =>
      customerDao.create({ name: "Cliente Mal Pago", phone: "555" }),
    );

    const layaway = await runWithTenant(tenantId, () =>
      layawayService.open({
        customerId: customer.id,
        cashSessionId: session.id,
        depositAmount: 40,
        depositMethod: "efectivo",
        expiresAt: futureDate(),
        items: [{ inventoryItemId: item.id, quantity: 1, unitPrice: 100 }],
      }),
    );

    await expect(
      runWithTenant(tenantId, () =>
        layawayService.complete(layaway.id, [{ method: "tarjeta", amount: 50 }], session.id),
      ),
    ).rejects.toThrow("no coincide con el saldo restante");

    const stock = await runWithTenant(tenantId, () => inventoryService.getById(item.id));
    expect(stock?.quantityOnHand).toBe(5); // nada se consumio
  });

  it("cancels an open layaway: releases the reservation without touching stock, deposit stays in the ledger as-is", async () => {
    const session = await openSessionHelper("5");
    const item = await makeItem("LAY-CANCEL", "5", 5);
    const customer = await runWithTenant(tenantId, () =>
      customerDao.create({ name: "Cliente Cancela Apartado", phone: "555" }),
    );

    const layaway = await runWithTenant(tenantId, () =>
      layawayService.open({
        customerId: customer.id,
        cashSessionId: session.id,
        depositAmount: 20,
        depositMethod: "efectivo",
        expiresAt: futureDate(),
        items: [{ inventoryItemId: item.id, quantity: 1, unitPrice: 100 }],
      }),
    );

    const cancelled = await runWithTenant(tenantId, () => layawayService.cancel(layaway.id));
    expect(cancelled.status).toBe("cancelled");

    const stock = await runWithTenant(tenantId, () => inventoryService.getById(item.id));
    expect(stock?.quantityOnHand).toBe(5); // nunca se toco
    const available = await runWithTenant(tenantId, () =>
      inventoryService.getAvailableQuantity(item.id),
    );
    expect(available).toBe(5); // reserva liberada

    const movements = await runWithTenant(tenantId, () =>
      cashMovementDao.findBySession(session.id),
    );
    const deposit = movements.find(
      (m) => m.relatedEntityType === "layaway" && m.relatedEntityId === layaway.id,
    );
    expect(deposit).toBeDefined(); // el anticipo no se reembolsa solo
  });

  it("expires a past-due layaway lazily on read, releasing its reservation", async () => {
    const session = await openSessionHelper("6");
    const item = await makeItem("LAY-EXPIRE", "6", 5);
    const customer = await runWithTenant(tenantId, () =>
      customerDao.create({ name: "Cliente Vencido", phone: "555" }),
    );

    const layaway = await runWithTenant(tenantId, () =>
      layawayService.open({
        customerId: customer.id,
        cashSessionId: session.id,
        depositAmount: 20,
        depositMethod: "efectivo",
        expiresAt: futureDate(),
        items: [{ inventoryItemId: item.id, quantity: 1, unitPrice: 100 }],
      }),
    );
    await AppDataSource.getRepository(Layaway).update(layaway.id, { expiresAt: pastDate() });

    const read = await runWithTenant(tenantId, () => layawayService.getById(layaway.id));
    expect(read?.status).toBe("expired");

    const available = await runWithTenant(tenantId, () =>
      inventoryService.getAvailableQuantity(item.id),
    );
    expect(available).toBe(5); // reserva liberada por vencimiento

    await expect(
      runWithTenant(tenantId, () =>
        layawayService.complete(layaway.id, [{ method: "tarjeta", amount: 80 }], session.id),
      ),
    ).rejects.toThrow("ya venció");
  });

  it("rejects opening a layaway for a customer that doesn't belong to this tenant (tenant isolation)", async () => {
    const otherTenantId = `${Date.now()}10`;
    const session = await openSessionHelper("7");
    const item = await makeItem("LAY-CROSS", "7", 5);
    const customerOfOtherTenant = await runWithTenant(otherTenantId, () =>
      customerDao.create({ name: "Cliente Ajeno", phone: "555" }),
    );

    await expect(
      runWithTenant(tenantId, () =>
        layawayService.open({
          customerId: customerOfOtherTenant.id,
          cashSessionId: session.id,
          depositAmount: 20,
          depositMethod: "efectivo",
          expiresAt: futureDate(),
          items: [{ inventoryItemId: item.id, quantity: 1, unitPrice: 100 }],
        }),
      ),
    ).rejects.toThrow("Cliente no encontrado");
  });
});
