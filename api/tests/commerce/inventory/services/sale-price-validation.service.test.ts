import "reflect-metadata";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { SaleService } from "../../../../src/commerce/inventory/services/sale.service.js";
import type { SaleDao } from "../../../../src/commerce/inventory/daos/sale.dao.js";
import type { SaleItemDao } from "../../../../src/commerce/inventory/daos/sale-item.dao.js";
import type { SalePaymentDao } from "../../../../src/commerce/payments/daos/sale-payment.dao.js";
import type { InventoryService } from "../../../../src/commerce/inventory/services/inventory.service.js";
import type { LocalService } from "../../../../src/app_platform/local/services/local.service.js";
import type { CashSessionDao } from "../../../../src/commerce/cash/daos/cash-session.dao.js";
import type { ServiceTypeDao } from "../../../../src/commerce/service-types/daos/service-type.dao.js";
import type { CustomerDao } from "../../../../src/commerce/customers/daos/customer.dao.js";
import type { BranchDiscountCapService } from "../../../../src/identity/branches/services/branch-discount-cap.service.js";
import type { InventoryItemDao } from "../../../../src/commerce/inventory/daos/inventory-item.dao.js";
import type { PriceListDao } from "../../../../src/commerce/price-list/daos/price-list.dao.js";
import type { AuditLogService } from "../../../../src/core/audit/services/audit-log.service.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

// Transacción falsa instalada con spyOn sobre el AppDataSource real: ejecuta
// el callback con un manager que solo crea y guarda en memoria. vi.mock del
// módulo no es fiable en esta repo (pool vmThreads + suite completa: el
// módulo real se cuela y la transacción intenta conectar a Postgres). El spy
// muta la instancia que el servicio también importa, así que funciona con o
// sin aislamiento de módulos entre archivos. La validación de precios corre
// ANTES de la transacción, así que estos tests prueban el rechazo sin tocar
// Postgres; el camino feliz solo comprueba que la venta se crea con el
// empleado autenticado.
const created: Array<Record<string, unknown>> = [];
const fakeManager = {
  create: (_entity: unknown, data: Record<string, unknown>) => {
    created.push(data);
    return { ...data };
  },
  save: async (entity: Record<string, unknown>) => ({ ...entity, id: entity["id"] ?? "gen-id" }),
};
const transactionSpy = vi.spyOn(AppDataSource, "transaction");
// Se instala una sola vez para todo el archivo: mockRestore() en afterEach
// desinstalaría el spy y los tests siguientes usarían la transacción real.
transactionSpy.mockImplementation(async (fn) => fn(fakeManager));

const TENANT_ID = "123";
const ACTOR = { userId: "user-1", roles: ["owner"], permissions: new Set<string>() };

function makeService(overrides: {
  serviceType?: Record<string, unknown> | null;
  inventoryItem?: Record<string, unknown> | null;
  listPrice?: Record<string, unknown> | null;
  auditRecord?: ReturnType<typeof vi.fn>;
}) {
  const auditRecord = overrides.auditRecord ?? vi.fn().mockResolvedValue(undefined);
  const service = new SaleService(
    { findByIdempotencyKey: vi.fn().mockResolvedValue(null) } as unknown as SaleDao,
    {} as unknown as SaleItemDao,
    { sumCreditoForCustomer: vi.fn().mockResolvedValue("0") } as unknown as SalePaymentDao,
    {
      applyMovement: vi.fn().mockResolvedValue(undefined),
      assertUnreservedStock: vi.fn().mockResolvedValue(undefined),
    } as unknown as InventoryService,
    {
      getConfig: vi.fn().mockResolvedValue({ taxRatePercent: 0, timeZone: "America/Mexico_City" }),
      consumeSaleNumber: vi.fn().mockResolvedValue(42),
    } as unknown as LocalService,
    {
      findById: vi.fn().mockResolvedValue({ localId: "local-1", status: "open" }),
    } as unknown as CashSessionDao,
    {
      findById: vi.fn().mockResolvedValue(overrides.serviceType ?? null),
    } as unknown as ServiceTypeDao,
    {} as unknown as CustomerDao,
    { maxDiscountFor: vi.fn().mockResolvedValue(null) } as unknown as BranchDiscountCapService,
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

function salePayload(items: Array<Record<string, unknown>>, total: number) {
  return {
    localId: "local-1",
    cashSessionId: "session-1",
    payments: [{ method: "efectivo" as const, amount: total }],
    createdByEmployeeId: "empleado-ajeno",
    items,
  };
}

describe("SaleService.create: precio revalidado en servidor", () => {
  beforeEach(() => {
    created.length = 0;
  });

  afterAll(() => {
    transactionSpy.mockRestore();
  });

  it("rechaza un renglón de inventario cuyo precio no es precio_venta ni precio de lista", async () => {
    const { service } = makeService({
      inventoryItem: { id: "item-1", name: "Funda", salePrice: "100.00", supplierId: null },
    });
    await expect(
      runWithTenant(
        TENANT_ID,
        () =>
          service.create(
            salePayload(
              [{ lineType: "inventory_item", referenceId: "item-1", quantity: 1, unitPrice: 50 }],
              50,
            ),
            ["owner"],
          ),
        null,
        ACTOR,
      ),
    ).rejects.toThrow("no coincide con el precio de venta");
  });

  it("acepta el renglón al precio_venta y atribuye la venta al usuario autenticado, no al body", async () => {
    const { service } = makeService({
      inventoryItem: { id: "item-1", name: "Funda", salePrice: "100.00", supplierId: null },
    });
    await runWithTenant(
      TENANT_ID,
      () =>
        service.create(
          salePayload(
            [{ lineType: "inventory_item", referenceId: "item-1", quantity: 1, unitPrice: 100 }],
            100,
          ),
          ["owner"],
        ),
      null,
      ACTOR,
    );
    expect(created[0]?.["createdByEmployeeId"]).toBe("user-1");
  });

  it("acepta el renglón al precio de la lista de precios aunque difiera de precio_venta", async () => {
    const { service } = makeService({
      inventoryItem: { id: "item-1", name: "Pantalla X", salePrice: "100.00", supplierId: "sup-1" },
      listPrice: { price: "90.00" },
    });
    await runWithTenant(
      TENANT_ID,
      () =>
        service.create(
          salePayload(
            [{ lineType: "inventory_item", referenceId: "item-1", quantity: 1, unitPrice: 90 }],
            90,
          ),
          ["owner"],
        ),
      null,
      ACTOR,
    );
    expect(created[0]?.["totalValue"]).toBeDefined();
  });

  it("rechaza un renglón de inventario inexistente", async () => {
    const { service } = makeService({ inventoryItem: null });
    await expect(
      runWithTenant(
        TENANT_ID,
        () =>
          service.create(
            salePayload(
              [
                {
                  lineType: "inventory_item",
                  referenceId: "no-existe",
                  quantity: 1,
                  unitPrice: 10,
                },
              ],
              10,
            ),
            ["owner"],
          ),
        null,
        ACTOR,
      ),
    ).rejects.toThrow("No encontramos el producto en el inventario");
  });

  it("rechaza un servicio cuyo precio no coincide con su base_price configurado", async () => {
    const { service } = makeService({
      serviceType: { id: "st-1", name: "Reparación", basePrice: "250.00" },
    });
    await expect(
      runWithTenant(
        TENANT_ID,
        () =>
          service.create(
            salePayload(
              [{ lineType: "service_type", referenceId: "st-1", quantity: 1, unitPrice: 200 }],
              200,
            ),
            ["owner"],
          ),
        null,
        ACTOR,
      ),
    ).rejects.toThrow("precio base");
  });

  it("acepta el servicio a su base_price sin registrar bitácora", async () => {
    const { service, auditRecord } = makeService({
      serviceType: { id: "st-1", name: "Reparación", basePrice: "250.00" },
    });
    await runWithTenant(
      TENANT_ID,
      () =>
        service.create(
          salePayload(
            [{ lineType: "service_type", referenceId: "st-1", quantity: 1, unitPrice: 250 }],
            250,
          ),
          ["owner"],
        ),
      null,
      ACTOR,
    );
    expect(auditRecord).not.toHaveBeenCalled();
  });

  it("acepta precio fijado por humano cuando no hay base_price, y lo deja en bitácora", async () => {
    const { service, auditRecord } = makeService({
      serviceType: { id: "st-1", name: "Reparación", basePrice: null },
    });
    await runWithTenant(
      TENANT_ID,
      () =>
        service.create(
          salePayload(
            [{ lineType: "service_type", referenceId: "st-1", quantity: 1, unitPrice: 150 }],
            150,
          ),
          ["owner"],
        ),
      null,
      ACTOR,
    );
    expect(auditRecord).toHaveBeenCalledWith({
      tenantId: TENANT_ID,
      userId: "user-1",
      action: "sales.price_set",
      entity: "sale",
      entityId: "gen-id",
      details: { lineKind: "service_type", unitPrice: "150.00" },
    });
  });

  it("rechaza precio humano en 0 cuando no hay base_price", async () => {
    const { service } = makeService({
      serviceType: { id: "st-1", name: "Reparación", basePrice: null },
    });
    await expect(
      runWithTenant(
        TENANT_ID,
        () =>
          service.create(
            salePayload(
              [{ lineType: "service_type", referenceId: "st-1", quantity: 1, unitPrice: 0 }],
              1,
            ),
            ["owner"],
          ),
        null,
        ACTOR,
      ),
    ).rejects.toThrow("mayor a 0");
  });
});
