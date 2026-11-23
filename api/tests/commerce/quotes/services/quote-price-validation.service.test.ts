import "reflect-metadata";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { QuoteService } from "../../../../src/commerce/quotes/services/quote.service.js";
import type { QuoteDao } from "../../../../src/commerce/quotes/daos/quote.dao.js";
import type { QuoteItemDao } from "../../../../src/commerce/quotes/daos/quote-item.dao.js";
import type { QuoteServiceTypeDao } from "../../../../src/commerce/quotes/daos/quote-service-type.dao.js";
import type { LocalService } from "../../../../src/app_platform/local/services/local.service.js";
import type { RepairNoteService } from "../../../../src/commerce/repair-notes/services/repair-note.service.js";
import type { ServiceTypeDao } from "../../../../src/commerce/service-types/daos/service-type.dao.js";
import type { InventoryItemDao } from "../../../../src/commerce/inventory/daos/inventory-item.dao.js";
import type { PriceListDao } from "../../../../src/commerce/price-list/daos/price-list.dao.js";
import type { AuditLogService } from "../../../../src/core/audit/services/audit-log.service.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

// Transacción falsa instalada con spyOn sobre el AppDataSource real: ejecuta
// el callback con un manager en memoria. vi.mock del módulo no es fiable en
// esta repo (pool vmThreads + suite completa: el módulo real se cuela y la
// transacción intenta conectar a Postgres). Se instala una sola vez para todo
// el archivo: mockRestore() en afterEach desinstalaría el spy y los tests
// siguientes usarían la transacción real.
const created: Array<Record<string, unknown>> = [];
const fakeManager = {
  create: (_entity: unknown, data: Record<string, unknown>) => {
    created.push(data);
    return { ...data };
  },
  save: async (entity: Record<string, unknown>) => ({ ...entity, id: entity["id"] ?? "gen-id" }),
  delete: async () => undefined,
  findOneBy: async () => null,
};
const transactionSpy = vi.spyOn(AppDataSource, "transaction");
transactionSpy.mockImplementation(async (fn) => fn(fakeManager));

const TENANT_ID = "123";
const ACTOR = { userId: "user-1", roles: ["owner"], permissions: new Set(["quotes.write"]) };

function makeService(overrides: {
  inventoryItem?: Record<string, unknown> | null;
  listPrice?: Record<string, unknown> | null;
  auditRecord?: ReturnType<typeof vi.fn>;
}) {
  const auditRecord = overrides.auditRecord ?? vi.fn().mockResolvedValue(undefined);
  const service = new QuoteService(
    { findById: vi.fn().mockResolvedValue({ id: "q-1" }) } as unknown as QuoteDao,
    {} as unknown as QuoteItemDao,
    {} as unknown as QuoteServiceTypeDao,
    { consumeFolio: vi.fn().mockResolvedValue(5) } as unknown as LocalService,
    { getById: vi.fn().mockResolvedValue(null) } as unknown as RepairNoteService,
    {} as unknown as ServiceTypeDao,
    {
      findById: vi.fn().mockResolvedValue(overrides.inventoryItem ?? null),
    } as unknown as InventoryItemDao,
    {
      findBySupplierAndModel: vi.fn().mockResolvedValue(overrides.listPrice ?? null),
    } as unknown as PriceListDao,
    { record: auditRecord } as unknown as AuditLogService,
  );
  return { service, auditRecord };
}

describe("QuoteService: precio revalidado en servidor", () => {
  beforeEach(() => {
    created.length = 0;
  });

  afterAll(() => {
    transactionSpy.mockRestore();
  });

  it("rechaza un renglón de inventario cuyo precio no es precio_venta ni precio de lista", async () => {
    const { service } = makeService({
      inventoryItem: { id: "item-1", name: "Pantalla", salePrice: "100.00", supplierId: null },
    });
    await expect(
      runWithTenant(
        TENANT_ID,
        () =>
          service.create({ localId: "1", customerName: "Juan" }, [
            { inventoryItemId: "item-1", description: "Pantalla", quantity: 1, unitPrice: 50 },
          ]),
        null,
        ACTOR,
      ),
    ).rejects.toThrow("no coincide con el precio de venta");
  });

  it("acepta el renglón al precio_venta", async () => {
    const { service } = makeService({
      inventoryItem: { id: "item-1", name: "Pantalla", salePrice: "100.00", supplierId: null },
    });
    const quote = await runWithTenant(
      TENANT_ID,
      () =>
        service.create({ localId: "1", customerName: "Juan" }, [
          { inventoryItemId: "item-1", description: "Pantalla", quantity: 1, unitPrice: 100 },
        ]),
      null,
      ACTOR,
    );
    expect(quote.totalValue).toBe("100.00");
  });

  it("acepta renglón de texto libre con precio > 0 y lo deja en bitácora", async () => {
    const { service, auditRecord } = makeService({});
    await runWithTenant(
      TENANT_ID,
      () =>
        service.create({ localId: "1", customerName: "Juan" }, [
          { description: "Mano de obra", quantity: 2, unitPrice: 50 },
        ]),
      null,
      ACTOR,
    );
    expect(auditRecord).toHaveBeenCalledWith({
      tenantId: TENANT_ID,
      userId: "user-1",
      action: "sales.price_set",
      entity: "quote",
      entityId: "gen-id",
      details: { lineKind: "custom", unitPrice: "50.00" },
    });
  });

  it("rechaza renglón de texto libre en 0", async () => {
    const { service } = makeService({});
    await expect(
      runWithTenant(
        TENANT_ID,
        () =>
          service.create({ localId: "1", customerName: "Juan" }, [
            { description: "Gratis", quantity: 1, unitPrice: 0 },
          ]),
        null,
        ACTOR,
      ),
    ).rejects.toThrow("mayor a 0");
  });

  it("update también revalida los precios de los renglones nuevos", async () => {
    const { service } = makeService({
      inventoryItem: { id: "item-1", name: "Pantalla", salePrice: "100.00", supplierId: null },
    });
    await expect(
      runWithTenant(
        TENANT_ID,
        () =>
          service.update("q-1", {}, [
            { inventoryItemId: "item-1", description: "Pantalla", quantity: 1, unitPrice: 10 },
          ]),
        null,
        ACTOR,
      ),
    ).rejects.toThrow("no coincide con el precio de venta");
  });
});
