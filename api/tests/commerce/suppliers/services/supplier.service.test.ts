import { describe, expect, it, vi } from "vitest";
import { SupplierService } from "../../../../src/commerce/suppliers/services/supplier.service.js";
import type { SupplierDao } from "../../../../src/commerce/suppliers/daos/supplier.dao.js";
import type { Supplier } from "../../../../src/commerce/suppliers/entities/supplier.entity.js";
import { mockEntity } from "../../../support/mock-entity.js";

function makeDao() {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as SupplierDao;
}

describe("SupplierService", () => {
  it("creates, updates and deletes suppliers through the dao", async () => {
    const dao = makeDao();
    const created = mockEntity<Supplier>({ id: "s-1", name: "Proveedor Nuevo", phone: "123" });
    const updated = mockEntity<Supplier>({ id: "s-1", name: "Proveedor Editado", phone: "456" });
    vi.mocked(dao.create).mockResolvedValue(created);
    vi.mocked(dao.update).mockResolvedValue(updated);
    vi.mocked(dao.delete).mockResolvedValue(true);

    const service = new SupplierService(dao);

    await expect(service.create({ name: "Proveedor Nuevo", phone: "123" })).resolves.toEqual(created);
    await expect(service.update("s-1", { name: "Proveedor Editado", phone: "456" })).resolves.toEqual(updated);
    await expect(service.delete("s-1")).resolves.toBe(true);
  });
});
