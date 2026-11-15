import { describe, expect, it, vi } from "vitest";
import { ServiceTypeService } from "../../../../src/commerce/service-types/services/service-type.service.js";
import type { ServiceTypeDao } from "../../../../src/commerce/service-types/daos/service-type.dao.js";
import type { ServiceType } from "../../../../src/commerce/service-types/entities/service-type.entity.js";
import { mockEntity } from "../../../support/mock-entity.js";

function makeDao() {
  return {
    findAllOrdered: vi.fn(),
    findByName: vi.fn(),
    create: vi.fn(),
  } as unknown as ServiceTypeDao;
}

describe("ServiceTypeService", () => {
  it("seeds the 5 historic types plus Software/Sistema when none exist yet", async () => {
    const dao = makeDao();
    vi.mocked(dao.findByName).mockResolvedValue(null);

    const service = new ServiceTypeService(dao);
    await service.seed();

    expect(dao.create).toHaveBeenCalledTimes(7);
    expect(dao.create).toHaveBeenCalledWith({ name: "Software" });
    expect(dao.create).toHaveBeenCalledWith({ name: "Sistema" });
  });

  it("is idempotent: skips types that already exist", async () => {
    const dao = makeDao();
    vi.mocked(dao.findByName).mockResolvedValue(mockEntity<ServiceType>({ id: "existing" }));

    const service = new ServiceTypeService(dao);
    await service.seed();

    expect(dao.create).not.toHaveBeenCalled();
  });

  it("create rejects a blank name and dedupes an existing one by name", async () => {
    const dao = makeDao();
    const service = new ServiceTypeService(dao);

    await expect(service.create("  ")).rejects.toThrow("obligatorio");

    vi.mocked(dao.findByName).mockResolvedValue(mockEntity<ServiceType>({ id: "t-1", name: "Software" }));
    await expect(service.create("Software")).resolves.toEqual({ id: "t-1", name: "Software" });
    expect(dao.create).not.toHaveBeenCalled();
  });
});
