import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { Local } from "../../../../src/app_platform/local/entities/local.entity.js";
import { LocalDao } from "../../../../src/app_platform/local/daos/local.dao.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

// Integration test: requires a reachable Postgres. Mismo patron que
// consumeControlNumber/consumeSaleNumber -- consumeReturnNumber (Fase 5,
// Rama Devoluciones) es un contador atomico propio, nunca comparte folio
// con venta.
describe("LocalDao.consumeReturnNumber", () => {
  let dao: LocalDao;
  const tenantId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

  beforeAll(async () => {
    await AppDataSource.initialize();
    dao = new LocalDao(AppDataSource.getRepository(Local));
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("never hands out the same return number twice to concurrent callers", async () => {
    const results = await runWithTenant(tenantId, () =>
      Promise.all([
        dao.consumeReturnNumber(),
        dao.consumeReturnNumber(),
        dao.consumeReturnNumber(),
        dao.consumeReturnNumber(),
        dao.consumeReturnNumber(),
      ]),
    );

    expect(new Set(results).size).toBe(results.length);
  });

  it("starts at 1 and is independent from the sale-number counter", async () => {
    const otherTenantId = `${Date.now()}${Math.floor(Math.random() * 1000)}1`;
    const [returnNumber, saleNumber] = await runWithTenant(otherTenantId, () =>
      Promise.all([dao.consumeReturnNumber(), dao.consumeSaleNumber()]),
    );
    expect(returnNumber).toBe(1);
    expect(saleNumber).toBe(1);
  });
});
