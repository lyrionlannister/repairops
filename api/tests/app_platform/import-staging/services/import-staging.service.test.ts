import { describe, expect, it, vi } from "vitest";
import { ImportStagingService } from "../../../../src/app_platform/import-staging/services/import-staging.service.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";
import type { PriceListDao } from "../../../../src/commerce/price-list/daos/price-list.dao.js";
import type { RedisLike } from "../../../../src/app_platform/import-staging/types.js";
import type { SupplierDao } from "../../../../src/commerce/suppliers/daos/supplier.dao.js";
import { getCurrentTenantId } from "../../../../src/core/tenancy/tenant-context.js";

const TENANT_A = "1";
const TENANT_B = "2";
const SUPPLIER_A = "10";

function makeSupplierDao(): SupplierDao {
  return {
    findById: vi.fn(async (id: string) =>
      id === SUPPLIER_A && getCurrentTenantId() === TENANT_A ? { id, tenantId: TENANT_A } : null,
    ),
  } as unknown as SupplierDao;
}

function makeFakeRedis(): RedisLike {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
      return "OK";
    }),
    del: vi.fn(async (key: string) => {
      store.delete(key);
      return 1;
    }),
  };
}

function makePriceListDao(): PriceListDao {
  return {
    replaceForSupplier: vi.fn().mockResolvedValue(undefined),
  } as unknown as PriceListDao;
}

async function startUploadOrThrow(service: ImportStagingService): Promise<{ importId: string }> {
  const started = await runWithTenant(TENANT_A, () => service.startUpload(SUPPLIER_A));
  if (!started) throw new Error("startUpload devolvió null");
  return started;
}

describe("ImportStagingService", () => {
  it("startUpload rechaza un proveedor de otro tenant o inexistente", async () => {
    const service = new ImportStagingService(
      makeFakeRedis(),
      makePriceListDao(),
      makeSupplierDao(),
    );

    expect(await runWithTenant(TENANT_B, () => service.startUpload(SUPPLIER_A))).toBeNull();
    expect(await runWithTenant(TENANT_A, () => service.startUpload("999"))).toBeNull();
    expect(await runWithTenant(TENANT_A, () => service.startUpload("abc"))).toBeNull();
  });

  it("startUpload crea un staging en estado processing, luego el callback lo deja ready", async () => {
    const redis = makeFakeRedis();
    const service = new ImportStagingService(redis, makePriceListDao(), makeSupplierDao());

    const { importId } = await startUploadOrThrow(service);
    const processing = await runWithTenant(TENANT_A, () => service.getById(importId));
    expect(processing?.status).toBe("processing");

    await service.applyCallback(TENANT_A, importId, {
      rows: [{ brand: "Samsung", model: "A15", price: 250 }],
    });

    const ready = await runWithTenant(TENANT_A, () => service.getById(importId));
    expect(ready?.status).toBe("ready");
    expect(ready?.rows).toHaveLength(1);
  });

  it("applyCallback con error deja el staging en estado error", async () => {
    const redis = makeFakeRedis();
    const service = new ImportStagingService(redis, makePriceListDao(), makeSupplierDao());

    const { importId } = await startUploadOrThrow(service);
    await service.applyCallback(TENANT_A, importId, { error: "PDF ilegible" });

    const record = await runWithTenant(TENANT_A, () => service.getById(importId));
    expect(record?.status).toBe("error");
    expect(record?.error).toBe("PDF ilegible");
  });

  it("un tenant no puede leer el staging de otro tenant (claves aisladas por tenantId)", async () => {
    const redis = makeFakeRedis();
    const service = new ImportStagingService(redis, makePriceListDao(), makeSupplierDao());

    const { importId } = await startUploadOrThrow(service);
    const fromOtherTenant = await runWithTenant(TENANT_B, () => service.getById(importId));
    expect(fromOtherTenant).toBeNull();
  });

  it("commit falla si el staging todavía está processing", async () => {
    const redis = makeFakeRedis();
    const service = new ImportStagingService(redis, makePriceListDao(), makeSupplierDao());

    const { importId } = await startUploadOrThrow(service);
    await expect(runWithTenant(TENANT_A, () => service.commit(importId))).rejects.toThrow(
      "aún no está listo",
    );
  });

  it("commit escribe las filas via PriceListDao y borra la key de Redis", async () => {
    const redis = makeFakeRedis();
    const priceListDao = makePriceListDao();
    const service = new ImportStagingService(redis, priceListDao, makeSupplierDao());

    const { importId } = await startUploadOrThrow(service);
    await service.applyCallback(TENANT_A, importId, {
      rows: [
        { brand: " Samsung ", model: "A15", price: 0.1 + 0.2 },
        { brand: "Samsung", model: "A23", price: 300.005 },
      ],
    });

    const result = await runWithTenant(TENANT_A, () => service.commit(importId));
    expect(result).toEqual({ imported: 2 });
    expect(priceListDao.replaceForSupplier).toHaveBeenCalledWith(SUPPLIER_A, [
      { brand: "Samsung", model: "A15", price: "0.30" },
      { brand: "Samsung", model: "A23", price: "300.01" },
    ]);

    const afterCommit = await runWithTenant(TENANT_A, () => service.getById(importId));
    expect(afterCommit).toBeNull();
  });

  it("updateRows sobreescribe las filas antes de confirmar", async () => {
    const redis = makeFakeRedis();
    const service = new ImportStagingService(redis, makePriceListDao(), makeSupplierDao());

    const { importId } = await startUploadOrThrow(service);
    await service.applyCallback(TENANT_A, importId, {
      rows: [{ brand: "Samsung", model: "A15", price: 250 }],
    });

    const updated = await runWithTenant(TENANT_A, () =>
      service.updateRows(importId, [{ brand: "Samsung", model: "A15 corregido", price: 260 }]),
    );
    expect(updated?.rows).toEqual([{ brand: "Samsung", model: "A15 corregido", price: 260 }]);
  });

  it("discard borra el staging sin confirmar", async () => {
    const redis = makeFakeRedis();
    const service = new ImportStagingService(redis, makePriceListDao(), makeSupplierDao());

    const { importId } = await startUploadOrThrow(service);
    await runWithTenant(TENANT_A, () => service.discard(importId));

    const record = await runWithTenant(TENANT_A, () => service.getById(importId));
    expect(record).toBeNull();
  });
});
