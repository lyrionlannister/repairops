import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { CustomerPaymentService } from "../../../../src/commerce/customers/services/customer-payment.service.js";
import type { CustomerPaymentDao } from "../../../../src/commerce/customers/daos/customer-payment.dao.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

// Transacción falsa instalada con spyOn sobre el AppDataSource real (mismo
// patrón que sale-price-validation.service.test.ts): ejecuta el callback con
// un manager en memoria. El saldo a crédito se finge en 500 (500 ventas +
// 500 notas - 500 abonos), así que un abono de 100 pasa la validación sin
// tocar Postgres.
const created: Array<Record<string, unknown>> = [];
const fakeQb = {
  innerJoin: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  andWhere: vi.fn().mockReturnThis(),
  getRawOne: vi.fn().mockResolvedValue({ total: "500.00" }),
};
const fakeManager = {
  findOneBy: vi
    .fn()
    .mockImplementation((_entity: unknown, where: Record<string, unknown>) =>
      Promise.resolve({ id: "cust-1", name: "Cliente", ...where }),
    ),
  findOne: vi.fn().mockResolvedValue({ id: "session-1", status: "open" }),
  create: (_entity: unknown, data: Record<string, unknown>) => {
    created.push(data);
    return { ...data };
  },
  save: async (entity: Record<string, unknown>) => ({ ...entity, id: entity["id"] ?? "gen-id" }),
  createQueryBuilder: vi.fn().mockReturnValue(fakeQb),
};
const transactionSpy = vi.spyOn(AppDataSource, "transaction");
// Se instala una sola vez para todo el archivo: mockRestore() en afterEach
// desinstalaría el spy y los tests siguientes usarían la transacción real.
transactionSpy.mockImplementation(async (fn) => fn(fakeManager));

const TENANT_ID = "123";
const ACTOR = { userId: "user-1", roles: ["owner"], permissions: new Set<string>() };

describe("CustomerPaymentService.register: empleado autenticado", () => {
  beforeEach(() => {
    created.length = 0;
  });

  it("ignora el createdByEmployeeId del cliente y guarda el usuario autenticado", async () => {
    const service = new CustomerPaymentService({} as unknown as CustomerPaymentDao);
    const payment = await runWithTenant(
      TENANT_ID,
      () =>
        service.register({
          customerId: "cust-1",
          localId: "9001",
          amount: 100,
          method: "efectivo",
          createdByEmployeeId: "empleado-ajeno",
        }),
      null,
      ACTOR,
    );
    expect(payment["createdByEmployeeId"]).toBe("user-1");
    // El abono y su movimiento de caja quedan con el empleado autenticado.
    expect(created).toHaveLength(2);
    expect(created.every((row) => row["createdByEmployeeId"] === "user-1")).toBe(true);
  });
});
