import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../src/core/config/data-source.js";
import { runWithTenant } from "../../src/core/tenancy/tenant-context.js";
import { Customer } from "../../src/commerce/customers/entities/customer.entity.js";
import { Layaway } from "../../src/commerce/customers/entities/layaway.entity.js";
import { LayawayDao } from "../../src/commerce/customers/daos/layaway.dao.js";
import { Quote } from "../../src/commerce/quotes/entities/quote.entity.js";
import { QuoteDao } from "../../src/commerce/quotes/daos/quote.dao.js";
import { Supplier } from "../../src/commerce/suppliers/entities/supplier.entity.js";
import { PriceListItem } from "../../src/commerce/price-list/entities/price-list-item.entity.js";
import { PriceListDao } from "../../src/commerce/price-list/daos/price-list.dao.js";
import { InventoryItem } from "../../src/commerce/inventory/entities/inventory-item.entity.js";
import { InventoryTransfer } from "../../src/commerce/inventory/entities/inventory-transfer.entity.js";
import { InventoryTransferDao } from "../../src/commerce/inventory/daos/inventory-transfer.dao.js";
import { InventoryMovement } from "../../src/commerce/inventory/entities/inventory-movement.entity.js";
import { InventoryMovementDao } from "../../src/commerce/inventory/daos/inventory-movement.dao.js";
import { CashSession } from "../../src/commerce/cash/entities/cash-session.entity.js";
import { CashSessionDao } from "../../src/commerce/cash/daos/cash-session.dao.js";

// Paginacion en el servidor de los listados restantes: corte de pagina, total, filtros
// y aislamiento entre talleres (tenant A nunca ve filas de tenant B).
describe("listados paginados", () => {
  const base = Date.now();
  const tenantA = `${base}71`;
  const tenantB = `${base}72`;
  const inA = <T>(fn: () => Promise<T>) => runWithTenant(tenantA, fn);
  const inB = <T>(fn: () => Promise<T>) => runWithTenant(tenantB, fn);
  const first = { page: 1, pageSize: 10 };

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("quotes: search by customer, folio or device; filter status; isolate tenants", async () => {
    const dao = new QuoteDao(AppDataSource.getRepository(Quote));
    const quote = (
      tenantId: string,
      quoteNumber: number,
      customerName: string,
      status: string,
      model?: string,
    ) => ({
      tenantId,
      localId: "1",
      quoteNumber,
      customerName,
      status,
      ...(model ? { kind: "repair", brand: "Samsung", model, reportedFailure: "Pantalla" } : {}),
    });
    await AppDataSource.getRepository(Quote).save([
      quote(tenantA, 1, "Ana", "pending"),
      quote(tenantA, 2, "Beto", "accepted", "A15"),
      quote(tenantB, 1, "Ana", "pending"),
    ] as Partial<Quote>[]);
    expect(
      (await inA(() => dao.findPage({ branchId: null }, { page: 1, pageSize: 1 }))).total,
    ).toBe(2);
    expect(
      (await inA(() => dao.findPage({ branchId: null, search: "samsung a1" }, first))).items.map(
        (q) => q.quoteNumber,
      ),
    ).toEqual([2]);
    expect(
      (await inA(() => dao.findPage({ branchId: null, status: "pending" }, first))).items.map(
        (q) => q.customerName,
      ),
    ).toEqual(["Ana"]);
    expect((await inB(() => dao.findPage({ branchId: null }, first))).total).toBe(1);
  });

  it("layaways: carry the customer name, search it and isolate tenants", async () => {
    const dao = new LayawayDao(AppDataSource.getRepository(Layaway));
    const [ana, beto, ajena] = await AppDataSource.getRepository(Customer).save([
      { tenantId: tenantA, name: "Ana Paginada" },
      { tenantId: tenantA, name: "Beto Paginado" },
      { tenantId: tenantB, name: "Ana Ajena" },
    ] as Partial<Customer>[]);
    const layaway = (tenantId: string, customerId: string, status: string) => ({
      tenantId,
      localId: "1",
      customerId,
      status,
      totalValue: "100.00",
      depositAmount: "10.00",
      depositMethod: "efectivo",
      expiresAt: "2099-12-31",
    });
    await AppDataSource.getRepository(Layaway).save([
      layaway(tenantA, ana.id, "open"),
      layaway(tenantA, beto.id, "completed"),
      layaway(tenantB, ajena.id, "open"),
    ] as Partial<Layaway>[]);
    const byName = await inA(() => dao.findPage({ branchId: null, search: "ana" }, first));
    expect(byName.items.map((l) => l.customerName)).toEqual(["Ana Paginada"]);
    const open = await inA(() => dao.findPage({ branchId: null, status: "open" }, first));
    expect(open.total).toBe(1);
    expect(
      (await inB(() => dao.findPage({ branchId: null }, first))).items.map((l) => l.customerName),
    ).toEqual(["Ana Ajena"]);
  });

  it("layaways: finds open layaways past their due date only", async () => {
    const dao = new LayawayDao(AppDataSource.getRepository(Layaway));
    const [customer] = await AppDataSource.getRepository(Customer).save([
      { tenantId: tenantA, name: "Vencido" },
    ] as Partial<Customer>[]);
    await AppDataSource.getRepository(Layaway).save({
      tenantId: tenantA,
      localId: "1",
      customerId: customer.id,
      status: "open",
      totalValue: "50.00",
      depositAmount: "5.00",
      depositMethod: "efectivo",
      expiresAt: "2020-01-01",
    } as Partial<Layaway>);
    const due = await inA(() => dao.findOpenDue("2026-01-01"));
    expect(due.map((l) => l.expiresAt)).toEqual(["2020-01-01"]);
    expect(await inB(() => dao.findOpenDue("2026-01-01"))).toEqual([]);
  });

  it("price list: filter brand/supplier, search model, list brands per tenant", async () => {
    const dao = new PriceListDao(AppDataSource.getRepository(PriceListItem));
    const [supplierA, supplierB] = await AppDataSource.getRepository(Supplier).save([
      { tenantId: tenantA, name: "Prov A", phone: "1" },
      { tenantId: tenantB, name: "Prov B", phone: "2" },
    ] as Partial<Supplier>[]);
    await AppDataSource.getRepository(PriceListItem).save([
      {
        tenantId: tenantA,
        supplierId: supplierA.id,
        brand: "Samsung",
        model: "A15",
        price: "10.00",
      },
      {
        tenantId: tenantA,
        supplierId: supplierA.id,
        brand: "Motorola",
        model: "G84",
        price: "20.00",
      },
      {
        tenantId: tenantB,
        supplierId: supplierB.id,
        brand: "Xiaomi",
        model: "Note 9",
        price: "30.00",
      },
    ] as Partial<PriceListItem>[]);
    expect(
      (await inA(() => dao.findPage({ search: "g8" }, first))).items.map((i) => i.model),
    ).toEqual(["G84"]);
    expect(
      (await inA(() => dao.findPage({ brand: "Samsung" }, first))).items.map((i) => i.model),
    ).toEqual(["A15"]);
    expect((await inA(() => dao.findPage({ supplierId: supplierA.id }, first))).total).toBe(2);
    expect(await inA(() => dao.distinctBrands())).toEqual(["Motorola", "Samsung"]);
    expect(await inB(() => dao.distinctBrands())).toEqual(["Xiaomi"]);
  });

  it("transfers and movements: page with item labels, isolate tenants", async () => {
    const item = (tenantId: string, name: string) => ({
      tenantId,
      localId: "1",
      name,
      kind: "part",
      costPrice: "1.00",
      salePrice: "2.00",
      quantityOnHand: 5,
      minStock: 0,
    });
    const [from, to, other] = await AppDataSource.getRepository(InventoryItem).save([
      item(tenantA, "Origen"),
      item(tenantA, "Destino"),
      item(tenantB, "Ajeno"),
    ] as Partial<InventoryItem>[]);
    await AppDataSource.getRepository(InventoryTransfer).save([
      { tenantId: tenantA, fromInventoryItemId: from.id, toInventoryItemId: to.id, quantity: 1 },
      {
        tenantId: tenantB,
        fromInventoryItemId: other.id,
        toInventoryItemId: other.id,
        quantity: 1,
      },
    ] as Partial<InventoryTransfer>[]);
    const transfers = await inA(() =>
      new InventoryTransferDao(AppDataSource.getRepository(InventoryTransfer)).findPage(first),
    );
    expect(transfers.total).toBe(1);
    expect(transfers.items[0]).toMatchObject({
      fromItem: { name: "Origen" },
      toItem: { name: "Destino" },
    });

    await AppDataSource.getRepository(InventoryMovement).save([
      {
        tenantId: tenantA,
        inventoryItemId: from.id,
        type: "in",
        quantity: 1,
        relatedEntityType: "manual",
      },
      {
        tenantId: tenantA,
        inventoryItemId: from.id,
        type: "out",
        quantity: 1,
        relatedEntityType: "manual",
      },
      {
        tenantId: tenantA,
        inventoryItemId: from.id,
        type: "in",
        quantity: 3,
        relatedEntityType: "manual",
      },
    ] as Partial<InventoryMovement>[]);
    const movements = new InventoryMovementDao(AppDataSource.getRepository(InventoryMovement));
    const page = await inA(() => movements.findPageByItem(from.id, { page: 1, pageSize: 2 }));
    expect(page.total).toBe(3);
    expect(page.items).toHaveLength(2);
    expect((await inB(() => movements.findPageByItem(from.id, first))).total).toBe(0);
  });

  it("cash cuts: count and offset closed sessions per tenant", async () => {
    const dao = new CashSessionDao(AppDataSource.getRepository(CashSession));
    const closed = (tenantId: string, cutNumber: number, closedAt: string) => ({
      tenantId,
      localId: "1",
      openingBalance: "0.00",
      closingBalance: "0.00",
      status: "closed",
      cutNumber,
      closedAt: new Date(closedAt),
    });
    await AppDataSource.getRepository(CashSession).save([
      closed(tenantA, 1, "2026-01-01T10:00:00Z"),
      closed(tenantA, 2, "2026-01-02T10:00:00Z"),
      closed(tenantA, 3, "2026-01-03T10:00:00Z"),
      closed(tenantB, 1, "2026-01-01T10:00:00Z"),
    ] as Partial<CashSession>[]);
    expect(await inA(() => dao.countClosedCuts(null))).toBe(3);
    const second = await inA(() => dao.findClosedCuts({ branchId: null, limit: 2, offset: 2 }));
    expect(second.map((c) => c.cutNumber)).toEqual([1]);
    expect(await inB(() => dao.countClosedCuts(null))).toBe(1);
  });
});
