import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { PriceListItem } from "../../../../src/commerce/price-list/entities/price-list-item.entity.js";
import { PriceListDao } from "../../../../src/commerce/price-list/daos/price-list.dao.js";
import { Supplier } from "../../../../src/commerce/suppliers/entities/supplier.entity.js";
import { SupplierDao } from "../../../../src/commerce/suppliers/daos/supplier.dao.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

describe("PriceListDao.replaceForSupplier", () => {
  let dao: PriceListDao;
  let suppliers: SupplierDao;
  const base = Date.now();
  const tenantA = `${base}1`;
  const tenantB = `${base}2`;

  beforeAll(async () => {
    await AppDataSource.initialize();
    dao = new PriceListDao(AppDataSource.getRepository(PriceListItem));
    suppliers = new SupplierDao(AppDataSource.getRepository(Supplier));
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("reemplaza solo la lista del proveedor y tenant actuales, con precio exacto", async () => {
    const supplierA = await runWithTenant(tenantA, () =>
      suppliers.create({ name: "Prov A", phone: "1" }),
    );
    const otherSupplierA = await runWithTenant(tenantA, () =>
      suppliers.create({ name: "Prov A2", phone: "2" }),
    );
    const supplierB = await runWithTenant(tenantB, () =>
      suppliers.create({ name: "Prov B", phone: "3" }),
    );

    await runWithTenant(tenantA, () =>
      dao.replaceForSupplier(supplierA.id, [{ brand: "Samsung", model: "Viejo", price: "100.00" }]),
    );
    await runWithTenant(tenantA, () =>
      dao.replaceForSupplier(otherSupplierA.id, [{ brand: "Moto", model: "G7", price: "50.00" }]),
    );
    await runWithTenant(tenantB, () =>
      dao.replaceForSupplier(supplierB.id, [{ brand: "Xiaomi", model: "Note 9", price: "80.00" }]),
    );

    await runWithTenant(tenantA, () =>
      dao.replaceForSupplier(supplierA.id, [
        { brand: "Samsung", model: "A15", price: "0.30" },
        { brand: "Samsung", model: "A23", price: "300.00" },
      ]),
    );

    const itemsA = await runWithTenant(tenantA, () => dao.findAllOrdered());
    const itemsB = await runWithTenant(tenantB, () => dao.findAllOrdered());

    expect(itemsA.map((i) => [i.model, String(i.price)])).toEqual([
      ["G7", "50.00"],
      ["A15", "0.30"],
      ["A23", "300.00"],
    ]);
    expect(itemsB.map((i) => i.model)).toEqual(["Note 9"]);
  });

  it("no borra la lista de otro tenant aunque reciba su supplierId", async () => {
    const supplierB = await runWithTenant(tenantB, () =>
      suppliers.create({ name: "Prov B2", phone: "4" }),
    );
    await runWithTenant(tenantB, () =>
      dao.replaceForSupplier(supplierB.id, [{ brand: "LG", model: "K40", price: "70.00" }]),
    );

    await runWithTenant(tenantA, () => dao.replaceForSupplier(supplierB.id, []));

    const itemsB = await runWithTenant(tenantB, () => dao.findAllOrdered());
    expect(itemsB.map((i) => i.model)).toContain("K40");
  });
});
