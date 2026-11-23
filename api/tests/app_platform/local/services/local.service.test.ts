import { describe, expect, it, vi } from "vitest";
import { LocalService } from "../../../../src/app_platform/local/services/local.service.js";
import type { LocalDao } from "../../../../src/app_platform/local/daos/local.dao.js";
import type { Local } from "../../../../src/app_platform/local/entities/local.entity.js";
import { mockEntity } from "../../../support/mock-entity.js";

function makeDao() {
  return {
    findOrCreate: vi.fn(),
    update: vi.fn(),
    consume: vi.fn(),
    lastUsedFolios: vi.fn(),
  } as unknown as LocalDao;
}

describe("LocalService.updateConfig", () => {
  it("updates the existing (or newly created) local row, not a fresh one", async () => {
    const dao = makeDao();
    vi.mocked(dao.findOrCreate).mockResolvedValue(mockEntity<Local>({ id: "local-1", nextControlNumber: 1 }));
    vi.mocked(dao.update).mockResolvedValue(mockEntity<Local>({ id: "local-1", name: "Mi Taller" }));

    const service = new LocalService(dao);
    const result = await service.updateConfig({ name: "Mi Taller" });

    expect(dao.update).toHaveBeenCalledWith("local-1", { name: "Mi Taller" });
    expect(result).toMatchObject({ id: "local-1", name: "Mi Taller" });
  });
});

describe("LocalService.updateConfig name validation", () => {
  it("rejects a blank name without touching the dao", async () => {
    const dao = makeDao();
    const service = new LocalService(dao);

    await expect(service.updateConfig({ name: "   " })).rejects.toThrow("El nombre del local es obligatorio");
    expect(dao.update).not.toHaveBeenCalled();
  });
});

describe("LocalService.consumeControlNumber", () => {
  it("delegates straight to the dao", async () => {
    const dao = makeDao();
    vi.mocked(dao.consume).mockResolvedValue(9);

    const service = new LocalService(dao);
    await expect(service.consumeControlNumber()).resolves.toBe(9);
    expect(dao.consume).toHaveBeenCalledWith("control");
  });
});

describe("LocalService.updateConfig folios", () => {
  const lastUsed = { control: 40, sale: 0, return: 0, quote: 7, cut: 0, count: 0 };

  it("rechaza un folio igual o menor al ultimo asignado, sin tocar la base", async () => {
    const dao = makeDao();
    vi.mocked(dao.lastUsedFolios).mockResolvedValue(lastUsed);
    const service = new LocalService(dao);

    await expect(service.updateConfig({ nextControlNumber: 40 })).rejects.toThrow(
      "El siguiente folio de notas debe ser mayor a 40, el último ya asignado",
    );
    await expect(service.updateConfig({ nextQuoteNumber: 3 })).rejects.toThrow("cotizaciones");
    expect(dao.update).not.toHaveBeenCalled();
  });

  it("acepta un folio por encima del ultimo asignado y no consulta si no cambia ninguno", async () => {
    const dao = makeDao();
    vi.mocked(dao.lastUsedFolios).mockResolvedValue(lastUsed);
    vi.mocked(dao.findOrCreate).mockResolvedValue(mockEntity<Local>({ id: "local-1" }));
    vi.mocked(dao.update).mockResolvedValue(mockEntity<Local>({ id: "local-1", nextQuoteNumber: 100 }));
    const service = new LocalService(dao);

    await service.updateConfig({ nextQuoteNumber: 100, nextCutNumber: 1 });
    expect(dao.update).toHaveBeenCalledWith("local-1", expect.objectContaining({ nextQuoteNumber: 100, nextCutNumber: 1 }));

    vi.mocked(dao.lastUsedFolios).mockClear();
    await service.updateConfig({ name: "Mi Taller" });
    expect(dao.lastUsedFolios).not.toHaveBeenCalled();
  });
});

describe("LocalService.updateConfig brandColor", () => {
  async function save(brandColor: unknown) {
    const dao = makeDao();
    vi.mocked(dao.findOrCreate).mockResolvedValue(mockEntity<Local>({ id: "local-1" }));
    vi.mocked(dao.update).mockImplementation(async (_id, data) => mockEntity<Local>({ id: "local-1", ...data }));
    const service = new LocalService(dao);
    return { dao, service, run: () => service.updateConfig({ brandColor } as Partial<Local>) };
  }

  it("normaliza a minusculas y devuelve la paleta derivada", async () => {
    const { dao, run } = await save("#2563EB");
    const result = await run();
    expect(dao.update).toHaveBeenCalledWith("local-1", { brandColor: "#2563eb" });
    expect(result.brandPalette.base).toBe("#2563eb");
  });

  it("null restablece y devuelve la paleta por defecto", async () => {
    const { dao, run } = await save(null);
    const result = await run();
    expect(dao.update).toHaveBeenCalledWith("local-1", { brandColor: null });
    expect(result.brandPalette.dark).toBe("#1e40af");
  });

  it.each(["red", "#12345", "#gggggg", "123456", 42])("rechaza %s", async (value) => {
    const { dao, run } = await save(value);
    await expect(run()).rejects.toThrow("#RRGGBB");
    expect(dao.update).not.toHaveBeenCalled();
  });
});
