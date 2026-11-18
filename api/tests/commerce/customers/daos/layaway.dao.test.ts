import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { Customer } from "../../../../src/commerce/customers/entities/customer.entity.js";
import { Layaway } from "../../../../src/commerce/customers/entities/layaway.entity.js";
import { LayawayDao } from "../../../../src/commerce/customers/daos/layaway.dao.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

// Integration test against a real Postgres. Proves TenantScopedDao's
// isolation guarantee for layaways (localId agregado para aislamiento por
// sucursal), mismo patron que quote.dao.test.ts.
describe("LayawayDao tenant isolation", () => {
  let dao: LayawayDao;
  const base = Date.now();
  const tenantA = `${base}1`;
  const tenantB = `${base}2`;

  // layaways.id_cliente tiene FK real a customers (db-schema-design item 4):
  // cada apartado de prueba necesita un Customer real detras.
  const createCustomer = (tenantId: string): Promise<Customer> =>
    AppDataSource.getRepository(Customer).save({
      tenantId,
      name: `Cliente ${tenantId}`,
      phone: "5215500000000",
    } as Partial<Customer>);

  const data = (customerId: string) => ({
    localId: "1",
    customerId,
    status: "open" as const,
    totalValue: 100,
    depositAmount: 20,
    depositMethod: "efectivo" as const,
    expiresAt: "2026-12-31",
  });

  beforeAll(async () => {
    await AppDataSource.initialize();
    dao = new LayawayDao(AppDataSource.getRepository(Layaway));
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("findAllOrdered only returns the current tenant's layaways", async () => {
    const customerA = await createCustomer(tenantA);
    const customerB = await createCustomer(tenantB);
    await runWithTenant(tenantA, () => dao.create(data(customerA.id)));
    await runWithTenant(tenantB, () => dao.create(data(customerB.id)));

    const layawaysA = await runWithTenant(tenantA, () => dao.findAllOrdered());
    const layawaysB = await runWithTenant(tenantB, () => dao.findAllOrdered());

    expect(layawaysA.map((l) => l.customerId)).toEqual([customerA.id]);
    expect(layawaysB.map((l) => l.customerId)).toEqual([customerB.id]);
  });

  it("findById returns null for a row that belongs to another tenant", async () => {
    const customer = await createCustomer(tenantA);
    const created = await runWithTenant(tenantA, () => dao.create(data(customer.id)));

    const fromOwnTenant = await runWithTenant(tenantA, () => dao.findById(created.id));
    const fromOtherTenant = await runWithTenant(tenantB, () => dao.findById(created.id));

    expect(fromOwnTenant?.id).toBe(created.id);
    expect(fromOtherTenant).toBeNull();
  });

  it("delete cannot remove a row that belongs to another tenant", async () => {
    const customer = await createCustomer(tenantA);
    const created = await runWithTenant(tenantA, () => dao.create(data(customer.id)));

    const deletedByOther = await runWithTenant(tenantB, () => dao.delete(created.id));
    expect(deletedByOther).toBe(false);

    const stillThere = await runWithTenant(tenantA, () => dao.findById(created.id));
    expect(stillThere?.id).toBe(created.id);
  });
});
