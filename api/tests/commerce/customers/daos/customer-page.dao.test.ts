import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { Customer } from "../../../../src/commerce/customers/entities/customer.entity.js";
import { CustomerDao } from "../../../../src/commerce/customers/daos/customer.dao.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

describe("CustomerDao.findPage / lookup", () => {
  let dao: CustomerDao;
  const base = Date.now();
  const tenantA = `${base}41`;
  const tenantB = `${base}42`;
  let ids: string[] = [];

  beforeAll(async () => {
    await AppDataSource.initialize();
    dao = new CustomerDao(AppDataSource.getRepository(Customer));
    const saved = await AppDataSource.getRepository(Customer).save([
      { tenantId: tenantA, name: "Ana López", phone: "5551112222", email: "ana@correo.mx" },
      { tenantId: tenantA, name: "Beto", phone: "5553334444", email: null },
      { tenantId: tenantA, name: "Carla 50%", phone: null, email: "carla@correo.mx" },
      { tenantId: tenantB, name: "Ana Ajena", phone: "5551112222", email: null },
    ] as Partial<Customer>[]);
    ids = saved.map((c) => c.id);
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  const page = (tenantId: string, search?: string, extra: { ids?: string[]; page?: number } = {}) =>
    runWithTenant(tenantId, () =>
      dao.findPage({ search, ids: extra.ids }, { page: extra.page ?? 1, pageSize: 2 }),
    );

  it("orders by name, cuts the page and reports the full total", async () => {
    const first = await page(tenantA);
    expect(first.total).toBe(3);
    expect(first.items.map((c) => c.name)).toEqual(["Ana López", "Beto"]);
    expect((await page(tenantA, undefined, { page: 2 })).items.map((c) => c.name)).toEqual([
      "Carla 50%",
    ]);
  });

  it("searches name, phone and email, with % taken literally", async () => {
    expect((await page(tenantA, "333")).items.map((c) => c.name)).toEqual(["Beto"]);
    expect((await page(tenantA, "carla@")).items.map((c) => c.name)).toEqual(["Carla 50%"]);
    expect((await page(tenantA, "%")).items.map((c) => c.name)).toEqual(["Carla 50%"]);
  });

  it("restricts to the given ids", async () => {
    expect((await page(tenantA, undefined, { ids: [ids[1]] })).items.map((c) => c.name)).toEqual([
      "Beto",
    ]);
  });

  it("never returns another tenant's customers, even by id", async () => {
    const result = await page(tenantB, "ana", { ids: [ids[0], ids[3]] });
    expect(result.items.map((c) => c.name)).toEqual(["Ana Ajena"]);
    const lookup = await runWithTenant(tenantA, () => dao.lookup("ana", 10));
    expect(lookup.map((c) => c.name)).toEqual(["Ana López"]);
  });

  it("caps the lookup at the requested limit", async () => {
    expect(await runWithTenant(tenantA, () => dao.lookup(undefined, 2))).toHaveLength(2);
  });
});
