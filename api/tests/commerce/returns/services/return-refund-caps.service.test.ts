import "reflect-metadata";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { ReturnService } from "../../../../src/commerce/returns/services/return.service.js";
import type { ReturnDao } from "../../../../src/commerce/returns/daos/return.dao.js";
import type { ReturnItemDao } from "../../../../src/commerce/returns/daos/return-item.dao.js";
import type { SaleDao } from "../../../../src/commerce/inventory/daos/sale.dao.js";
import type { SaleItemDao } from "../../../../src/commerce/inventory/daos/sale-item.dao.js";
import type { CashSessionDao } from "../../../../src/commerce/cash/daos/cash-session.dao.js";
import type { InventoryService } from "../../../../src/commerce/inventory/services/inventory.service.js";
import type { LocalService } from "../../../../src/app_platform/local/services/local.service.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

// Transacción falsa instalada con spyOn sobre el AppDataSource real: ejecuta
// el callback con un manager en memoria y un query builder encadenable.
// getRawOne devuelve los totales que cada prueba programa, en el orden en
// que el servicio los pide (total ya reembolsado de la venta, cantidad ya
// devuelta de la línea, monto ya reembolsado de la línea). vi.mock del módulo
// no es fiable en esta repo (pool vmThreads + suite completa: el módulo real
// se cuela y la transacción intenta conectar a Postgres). Se instala una sola
// vez para todo el archivo: mockRestore() en afterEach desinstalaría el spy
// y los tests siguientes usarían la transacción real.
const created: Array<Record<string, unknown>> = [];
const sums: string[] = [];
const fakeManager = {
  create: (_entity: unknown, data: Record<string, unknown>) => {
    created.push(data);
    return { ...data };
  },
  save: async (entity: Record<string, unknown>) => ({ ...entity, id: entity["id"] ?? "ret-1" }),
  createQueryBuilder: () => {
    const qb = {
      setLock: () => qb,
      innerJoin: () => qb,
      select: () => qb,
      where: () => qb,
      getOne: async () => ({}),
      getRawOne: async () => ({ total: sums.shift() ?? "0" }),
    };
    return qb;
  },
};
const transactionSpy = vi.spyOn(AppDataSource, "transaction");
transactionSpy.mockImplementation(async (fn) => fn(fakeManager));

const TENANT_ID = "123";
const ACTOR = { userId: "user-1", roles: ["owner"], permissions: new Set<string>() };

function makeService() {
  return new ReturnService(
    { findByIdempotencyKey: vi.fn().mockResolvedValue(null) } as unknown as ReturnDao,
    {} as unknown as ReturnItemDao,
    {
      findById: vi.fn().mockResolvedValue({ id: "sale-1", totalValue: "60.00" }),
    } as unknown as SaleDao,
    {
      findById: vi.fn().mockResolvedValue({
        id: "si-1",
        saleId: "sale-1",
        lineType: "inventory_item",
        referenceId: "item-1",
        quantity: 2,
        unitPrice: "30.00",
      }),
    } as unknown as SaleItemDao,
    {
      findById: vi.fn().mockResolvedValue({ localId: "local-1", status: "open" }),
    } as unknown as CashSessionDao,
    { applyMovement: vi.fn().mockResolvedValue(undefined) } as unknown as InventoryService,
    { consumeReturnNumber: vi.fn().mockResolvedValue(7) } as unknown as LocalService,
  );
}

function returnPayload(items: Array<Record<string, unknown>>, totalRefunded: number) {
  return {
    saleId: "sale-1",
    cashSessionId: "session-1",
    refundMethod: "efectivo" as const,
    reason: "Defecto",
    totalRefunded,
    createdByEmployeeId: "empleado-ajeno",
    items,
  };
}

describe("ReturnService.create: topes de reembolso", () => {
  beforeEach(() => {
    created.length = 0;
    sums.length = 0;
  });

  afterAll(() => {
    transactionSpy.mockRestore();
  });

  it("rechaza un reembolso por línea mayor a unitPrice × cantidad devuelta", async () => {
    const service = makeService();
    await expect(
      runWithTenant(
        TENANT_ID,
        () =>
          service.create(
            returnPayload([{ saleItemId: "si-1", quantity: 1, refundAmount: 50 }], 50),
          ),
        null,
        ACTOR,
      ),
    ).rejects.toThrow("no puede superar su precio unitario");
  });

  it("rechaza cuando lo acumulado en la línea supera unitPrice × cantidad vendida", async () => {
    // Ya se reembolsaron 40 de esta línea en devoluciones previas.
    sums.push("0", "0", "40");
    const service = makeService();
    await expect(
      runWithTenant(
        TENANT_ID,
        () =>
          service.create(
            returnPayload([{ saleItemId: "si-1", quantity: 1, refundAmount: 30 }], 30),
          ),
        null,
        ACTOR,
      ),
    ).rejects.toThrow("acumulado");
  });

  it("rechaza cuando el total reembolsado de la venta supera su total", async () => {
    // Ya se reembolsaron 50 de esta venta en devoluciones previas.
    sums.push("50", "0", "0");
    const service = makeService();
    await expect(
      runWithTenant(
        TENANT_ID,
        () =>
          service.create(
            returnPayload([{ saleItemId: "si-1", quantity: 1, refundAmount: 30 }], 30),
          ),
        null,
        ACTOR,
      ),
    ).rejects.toThrow("no puede superar el total de la venta");
  });

  it("acepta el reembolso exacto al tope y atribuye la devolución al usuario autenticado", async () => {
    const service = makeService();
    await runWithTenant(
      TENANT_ID,
      () =>
        service.create(returnPayload([{ saleItemId: "si-1", quantity: 2, refundAmount: 60 }], 60)),
      null,
      ACTOR,
    );
    expect(created[0]?.["createdByEmployeeId"]).toBe("user-1");
    expect(created[0]?.["totalRefunded"]).toBe("60.00");
  });
});
