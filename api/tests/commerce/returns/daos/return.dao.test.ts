import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { Sale } from "../../../../src/commerce/inventory/entities/sale.entity.js";
import { Return } from "../../../../src/commerce/returns/entities/return.entity.js";
import { ReturnDao } from "../../../../src/commerce/returns/daos/return.dao.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

// Integration test against a real Postgres. Proves TenantScopedDao's
// isolation guarantee for returns (localId agregado para aislamiento por
// sucursal), mismo patron que quote.dao.test.ts.
describe("ReturnDao tenant isolation", () => {
  let dao: ReturnDao;
  const base = Date.now();
  const tenantA = `${base}1`;
  const tenantB = `${base}2`;

  // returns.id_venta tiene FK real a sales (db-schema-design item 4): cada
  // devolucion de prueba necesita una Sale real detras, no un id inventado.
  let nextSaleNumber = 1;
  let nextReturnNumber = 1;
  const createSale = (tenantId: string): Promise<Sale> =>
    AppDataSource.getRepository(Sale).save({
      tenantId,
      localId: "1",
      saleNumber: nextSaleNumber++,
      cashSessionId: "1",
      subtotal: 100,
      totalValue: 100,
    } as Partial<Sale>);

  const data = (saleId: string) => ({
    localId: "1",
    saleId,
    returnNumber: nextReturnNumber++,
    cashSessionId: "1",
    refundMethod: "efectivo" as const,
    reason: "Prueba",
    totalRefunded: 50,
  });

  beforeAll(async () => {
    await AppDataSource.initialize();
    dao = new ReturnDao(AppDataSource.getRepository(Return));
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("findBySaleId only returns the current tenant's returns", async () => {
    const saleA = await createSale(tenantA);
    const saleB = await createSale(tenantB);
    await runWithTenant(tenantA, () => dao.create(data(saleA.id)));
    await runWithTenant(tenantB, () => dao.create(data(saleB.id)));

    const returnsA = await runWithTenant(tenantA, () => dao.findBySaleId(saleA.id));
    const returnsB = await runWithTenant(tenantB, () => dao.findBySaleId(saleB.id));
    const crossTenant = await runWithTenant(tenantA, () => dao.findBySaleId(saleB.id));

    expect(returnsA.map((r) => r.saleId)).toEqual([saleA.id]);
    expect(returnsB.map((r) => r.saleId)).toEqual([saleB.id]);
    expect(crossTenant).toEqual([]);
  });

  it("findById returns null for a row that belongs to another tenant", async () => {
    const sale = await createSale(tenantA);
    const created = await runWithTenant(tenantA, () => dao.create(data(sale.id)));

    const fromOwnTenant = await runWithTenant(tenantA, () => dao.findById(created.id));
    const fromOtherTenant = await runWithTenant(tenantB, () => dao.findById(created.id));

    expect(fromOwnTenant?.id).toBe(created.id);
    expect(fromOtherTenant).toBeNull();
  });

  it("delete cannot remove a row that belongs to another tenant", async () => {
    const sale = await createSale(tenantA);
    const created = await runWithTenant(tenantA, () => dao.create(data(sale.id)));

    const deletedByOther = await runWithTenant(tenantB, () => dao.delete(created.id));
    expect(deletedByOther).toBe(false);

    const stillThere = await runWithTenant(tenantA, () => dao.findById(created.id));
    expect(stillThere?.id).toBe(created.id);
  });
});
