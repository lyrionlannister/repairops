import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { Sale } from "../../../../src/commerce/inventory/entities/sale.entity.js";
import { SaleDao } from "../../../../src/commerce/inventory/daos/sale.dao.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

describe("SaleDao.findPage / stats", () => {
  let dao: SaleDao;
  const base = Date.now();
  const tenantA = `${base}61`;
  const tenantB = `${base}62`;

  const sale = (
    tenantId: string,
    saleNumber: number,
    customerName: string | null,
    total: string,
    employee: string | null,
    createdAt: Date,
  ) => ({
    tenantId,
    localId: "1",
    saleNumber,
    customerName,
    cashSessionId: "1",
    subtotal: total,
    totalValue: total,
    createdByEmployeeId: employee,
    createdAt,
  });

  beforeAll(async () => {
    await AppDataSource.initialize();
    dao = new SaleDao(AppDataSource.getRepository(Sale));
    const now = new Date();
    await AppDataSource.getRepository(Sale).save([
      sale(tenantA, 1, "Ana", "0.10", "7", new Date("2020-01-15T12:00:00Z")),
      sale(tenantA, 2, null, "0.20", "7", now),
      sale(tenantA, 3, "Beto", "100.00", "8", now),
      sale(tenantB, 1, "Ana", "500.00", "7", now),
    ]);
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("pages newest first and searches by customer or folio", async () => {
    const first = await runWithTenant(tenantA, () =>
      dao.findPage({ branchId: null }, { page: 1, pageSize: 2 }),
    );
    expect(first.total).toBe(3);
    expect(first.items.map((s) => s.saleNumber)).toEqual([3, 2]);
    const byName = await runWithTenant(tenantA, () =>
      dao.findPage({ branchId: null, search: "ana" }, { page: 1, pageSize: 10 }),
    );
    expect(byName.items.map((s) => s.saleNumber)).toEqual([1]);
    const byFolio = await runWithTenant(tenantA, () =>
      dao.findPage({ branchId: null, search: "2" }, { page: 1, pageSize: 10 }),
    );
    expect(byFolio.items.map((s) => s.saleNumber)).toEqual([2]);
  });

  it("sums exactly per employee and per current month", async () => {
    expect(
      await runWithTenant(tenantA, () => dao.stats({ branchId: null, createdByEmployeeId: "7" })),
    ).toEqual({
      count: 2,
      total: "0.30",
    });
    expect(
      await runWithTenant(tenantA, () =>
        dao.stats({ branchId: null, currentMonthIn: "America/Mexico_City" }),
      ),
    ).toEqual({ count: 2, total: "100.20" });
  });

  it("never mixes another tenant's sales", async () => {
    const stats = await runWithTenant(tenantB, () => dao.stats({ branchId: null }));
    expect(stats).toEqual({ count: 1, total: "500.00" });
  });
});
