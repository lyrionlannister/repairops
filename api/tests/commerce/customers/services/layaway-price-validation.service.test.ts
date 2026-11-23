import "reflect-metadata";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { LayawayService } from "../../../../src/commerce/customers/services/layaway.service.js";
import type { LayawayDao } from "../../../../src/commerce/customers/daos/layaway.dao.js";
import type { LayawayItemDao } from "../../../../src/commerce/customers/daos/layaway-item.dao.js";
import type { CustomerDao } from "../../../../src/commerce/customers/daos/customer.dao.js";
import type { CashSessionDao } from "../../../../src/commerce/cash/daos/cash-session.dao.js";
import type { InventoryItemDao } from "../../../../src/commerce/inventory/daos/inventory-item.dao.js";
import type { InventoryReservationService } from "../../../../src/commerce/inventory/services/inventory-reservation.service.js";
import type { PriceListDao } from "../../../../src/commerce/price-list/daos/price-list.dao.js";
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
};
const transactionSpy = vi.spyOn(AppDataSource, "transaction");
transactionSpy.mockImplementation(async (fn) => fn(fakeManager));

const TENANT_ID = "123";
const ACTOR = { userId: "user-1", roles: ["owner"], permissions: new Set<string>() };

function makeService(inventoryItem: Record<string, unknown> | null) {
  return new LayawayService(
    {} as unknown as LayawayDao,
    {} as unknown as LayawayItemDao,
    { findById: vi.fn().mockResolvedValue({ id: "cust-1" }) } as unknown as CustomerDao,
    {
      findById: vi.fn().mockResolvedValue({ localId: "local-1", status: "open" }),
    } as unknown as CashSessionDao,
    { findById: vi.fn().mockResolvedValue(inventoryItem) } as unknown as InventoryItemDao,
    { reserve: vi.fn().mockResolvedValue(undefined) } as unknown as InventoryReservationService,
    { findBySupplierAndModel: vi.fn().mockResolvedValue(null) } as unknown as PriceListDao,
  );
}

function openPayload(unitPrice: number) {
  return {
    customerId: "cust-1",
    cashSessionId: "session-1",
    depositAmount: 30,
    depositMethod: "efectivo" as const,
    expiresAt: "2099-01-01",
    createdByEmployeeId: "empleado-ajeno",
    items: [{ inventoryItemId: "item-1", quantity: 1, unitPrice }],
  };
}

describe("LayawayService.open: precio revalidado en servidor", () => {
  beforeEach(() => {
    created.length = 0;
  });

  afterAll(() => {
    transactionSpy.mockRestore();
  });

  it("rechaza un renglón cuyo precio no es precio_venta ni precio de lista", async () => {
    const service = makeService({
      id: "item-1",
      name: "Funda",
      salePrice: "100.00",
      supplierId: null,
    });
    await expect(
      runWithTenant(TENANT_ID, () => service.open(openPayload(50)), null, ACTOR),
    ).rejects.toThrow("no coincide con el precio de venta");
  });

  it("acepta el apartado al precio_venta y atribuye el apartado al usuario autenticado", async () => {
    const service = makeService({
      id: "item-1",
      name: "Funda",
      salePrice: "100.00",
      supplierId: null,
    });
    await runWithTenant(TENANT_ID, () => service.open(openPayload(100)), null, ACTOR);
    expect(created[0]?.["createdByEmployeeId"]).toBe("user-1");
  });
});
