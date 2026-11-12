import { describe, expect, it, vi } from "vitest";
import { BranchService } from "../../../../src/identity/branches/services/branch.service.js";
import type { BranchDao } from "../../../../src/identity/branches/daos/branch.dao.js";
import type { Branch } from "../../../../src/identity/branches/entities/branch.entity.js";
import { mockEntity } from "../../../support/mock-entity.js";

function makeDao() {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  } as unknown as BranchDao;
}

describe("BranchService", () => {
  it("create rejects a blank name", async () => {
    const dao = makeDao();
    const service = new BranchService(dao);

    await expect(service.create({ name: "  " })).rejects.toThrow("obligatorio");
    expect(dao.create).not.toHaveBeenCalled();
  });

  it("create trims fields and defaults isActive to true", async () => {
    const dao = makeDao();
    vi.mocked(dao.create).mockResolvedValue(mockEntity<Branch>({ id: "b-1" }));
    const service = new BranchService(dao);

    await service.create({ name: " Sucursal Centro ", address: " Calle 1 ", phone: " 555 " });

    expect(dao.create).toHaveBeenCalledWith({
      name: "Sucursal Centro",
      address: "Calle 1",
      phone: "555",
      isActive: true,
    });
  });

  it("setActive toggles isActive via the dao", async () => {
    const dao = makeDao();
    vi.mocked(dao.update).mockResolvedValue(mockEntity<Branch>({ id: "b-1", isActive: false }));
    const service = new BranchService(dao);

    const result = await service.setActive("b-1", false);

    expect(dao.update).toHaveBeenCalledWith("b-1", { isActive: false });
    expect(result?.isActive).toBe(false);
  });

  it("seed only creates 'Sucursal principal' when the tenant has no branches yet", async () => {
    const dao = makeDao();
    vi.mocked(dao.count).mockResolvedValue(0);
    const service = new BranchService(dao);

    await service.seed({ name: "Mi Taller", address: "Av. Siempre Viva", phone: "123" });

    expect(dao.create).toHaveBeenCalledWith({
      name: "Mi Taller",
      address: "Av. Siempre Viva",
      phone: "123",
      isActive: true,
    });
  });

  it("seed is a no-op when the tenant already has branches", async () => {
    const dao = makeDao();
    vi.mocked(dao.count).mockResolvedValue(2);
    const service = new BranchService(dao);

    await service.seed({ name: "Mi Taller" });

    expect(dao.create).not.toHaveBeenCalled();
  });
});
