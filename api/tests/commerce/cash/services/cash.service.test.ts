import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { CashSession } from "../../../../src/commerce/cash/entities/cash-session.entity.js";
import { CashMovement } from "../../../../src/commerce/cash/entities/cash-movement.entity.js";
import { CashSessionDao } from "../../../../src/commerce/cash/daos/cash-session.dao.js";
import { CashMovementDao } from "../../../../src/commerce/cash/daos/cash-movement.dao.js";
import { CashService } from "../../../../src/commerce/cash/services/cash.service.js";
import { Local } from "../../../../src/app_platform/local/entities/local.entity.js";
import { LocalDao } from "../../../../src/app_platform/local/daos/local.dao.js";
import { LocalService } from "../../../../src/app_platform/local/services/local.service.js";
import { User } from "../../../../src/identity/auth/entities/user.entity.js";
import { UserDao } from "../../../../src/identity/auth/daos/user.dao.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";
import { ensureFixtureTenant } from "../../../support/tenant-fixture.subscriber.js";
import { makeUserRoleDao } from "../../../support/authz-deps.js";
import { effectivePermissions } from "../../../../src/identity/authz/permissions.js";

// Integration test against a real Postgres (same reasoning as
// quote.service.test.ts): proves the rounding rule end-to-end through
// LocalService.getConfig(), not just a mocked unit.
describe("CashService", () => {
  let service: CashService;
  let localService: LocalService;
  let userDao: UserDao;
  const tenantId = `${Date.now()}4`;

  beforeAll(async () => {
    await AppDataSource.initialize();
    await ensureFixtureTenant(AppDataSource, tenantId, `${tenantId}1`, `${tenantId}2`, `${tenantId}3`, `${tenantId}4`);
    const sessionDao = new CashSessionDao(AppDataSource.getRepository(CashSession));
    const movementDao = new CashMovementDao(AppDataSource.getRepository(CashMovement));
    localService = new LocalService(new LocalDao(AppDataSource.getRepository(Local)));
    userDao = new UserDao(AppDataSource.getRepository(User));
    service = new CashService(sessionDao, movementDao, localService, userDao, makeUserRoleDao());
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("rejects opening a second session while one is already open for the local", async () => {
    await runWithTenant(tenantId, () => service.openSession("1", 100));

    await expect(runWithTenant(tenantId, () => service.openSession("1", 50))).rejects.toThrow(
      "Ya hay una sesión de caja abierta",
    );
  });

  it("rejects registering a movement on a closed session", async () => {
    const closedTenant = `${tenantId}1`;
    const session = await runWithTenant(closedTenant, () => service.openSession("1", 0));
    await runWithTenant(closedTenant, () => service.closeSession(session.id, 0));

    await expect(
      runWithTenant(closedTenant, () =>
        service.registerMovement({ cashSessionId: session.id, type: "income", method: "tarjeta", amount: 50 }),
      ),
    ).rejects.toThrow("sesión cerrada");
  });

  it("rounds cash movements per the local's cashRoundingUnit, never card/transfer", async () => {
    const roundingTenant = `${tenantId}2`;
    await runWithTenant(roundingTenant, () => localService.updateConfig({ cashRoundingUnit: 0.5 }));
    const session = await runWithTenant(roundingTenant, () => service.openSession("1", 0));

    const cash = await runWithTenant(roundingTenant, () =>
      service.registerMovement({ cashSessionId: session.id, type: "income", method: "efectivo", amount: 123.3 }),
    );
    const card = await runWithTenant(roundingTenant, () =>
      service.registerMovement({ cashSessionId: session.id, type: "income", method: "tarjeta", amount: 123.3 }),
    );

    expect(Number(cash.amount)).toBe(123.5);
    expect(Number(card.amount)).toBe(123.3);
  });

  it("leaves amounts untouched when the local has no rounding configured", async () => {
    const noRoundTenant = `${tenantId}3`;
    const session = await runWithTenant(noRoundTenant, () => service.openSession("1", 0));

    const cash = await runWithTenant(noRoundTenant, () =>
      service.registerMovement({ cashSessionId: session.id, type: "income", method: "efectivo", amount: 99.37 }),
    );

    expect(Number(cash.amount)).toBe(99.37);
  });

  it("getSummary totals income/expense by method and nets them", async () => {
    const summaryTenant = `${tenantId}4`;
    const session = await runWithTenant(summaryTenant, () => service.openSession("1", 0));

    await runWithTenant(summaryTenant, () =>
      service.registerMovement({ cashSessionId: session.id, type: "income", method: "efectivo", amount: 100 }),
    );
    await runWithTenant(summaryTenant, () =>
      service.registerMovement({ cashSessionId: session.id, type: "income", method: "tarjeta", amount: 200 }),
    );
    await runWithTenant(summaryTenant, () =>
      service.registerMovement({ cashSessionId: session.id, type: "expense", method: "efectivo", amount: 30 }),
    );

    const owner = { userId: "1", roles: ["owner"], permissions: effectivePermissions(["owner"], false) };
    const summary = await runWithTenant(summaryTenant, () => service.getSummary(session.id), null, owner);

    expect(summary?.amountsHidden).toBe(false);
    expect(summary?.totalIncome).toBe("300.00");
    expect(summary?.totalExpense).toBe("30.00");
    expect(summary?.net).toBe("270.00");
    expect(summary?.byMethod.efectivo).toEqual({ income: "100.00", expense: "30.00" });
    expect(summary?.byMethod.tarjeta).toEqual({ income: "200.00", expense: "0.00" });
  });

  it("closeSession persists the closing balance and status when the balance matches exactly", async () => {
    const closeTenant = `${tenantId}5`;
    const session = await runWithTenant(closeTenant, () => service.openSession("1", 500));

    const closed = await runWithTenant(closeTenant, () => service.closeSession(session.id, 500));

    expect(closed.status).toBe("closed");
    expect(Number(closed.closingBalance)).toBe(500);
    expect(Number(closed.variance)).toBe(0);
    expect(closed.closedAt).not.toBeNull();
  });

  it("rejects closing with a non-zero variance and no reason", async () => {
    const varianceTenant = `${tenantId}6`;
    const session = await runWithTenant(varianceTenant, () => service.openSession("1", 500));

    await expect(runWithTenant(varianceTenant, () => service.closeSession(session.id, 480))).rejects.toThrow(
      "se requiere un motivo",
    );
  });

  it("rejects closing with a variance over the tenant's unauthorized limit and no authorizer", async () => {
    const bigVarianceTenant = `${tenantId}7`;
    const session = await runWithTenant(bigVarianceTenant, () => service.openSession("1", 500));

    await expect(
      runWithTenant(bigVarianceTenant, () => service.closeSession(session.id, 300, "Faltante grande")),
    ).rejects.toThrow("requiere autorización");
  });

  it("closes with a large variance when authorized by an owner/admin", async () => {
    const authorizedTenant = `${tenantId}8`;
    const authorizer = await runWithTenant(authorizedTenant, () =>
      userDao.create({
        firstName: "Due",
        lastName: "Ño",
        email: `owner.${authorizedTenant}@test.local`,
        password: "x",
      }),
    );
    await runWithTenant(authorizedTenant, () => makeUserRoleDao().replaceForUser(authorizer.id, ["owner"]));
    const session = await runWithTenant(authorizedTenant, () => service.openSession("1", 500));

    const closed = await runWithTenant(authorizedTenant, () =>
      service.closeSession(session.id, 300, "Faltante grande", authorizer.id),
    );

    expect(closed.status).toBe("closed");
    expect(Number(closed.variance)).toBe(-200);
    expect(closed.varianceAuthorizedByEmployeeId).toBe(authorizer.id);
  });

  it("abre la caja y registra movimientos a nombre del usuario de la sesión", async () => {
    const actorTenant = `${tenantId}8`;
    await ensureFixtureTenant(AppDataSource, actorTenant);
    const actor = { userId: "987654", roles: ["cashier"], permissions: new Set<string>() };
    const asCashier = <T>(fn: () => Promise<T>) => runWithTenant(actorTenant, fn, null, actor);

    const session = await asCashier(() => service.openSession("1", 0));
    const movement = await asCashier(() =>
      service.registerMovement({ cashSessionId: session.id, type: "income", method: "tarjeta", amount: 10 }),
    );

    expect(session.openedByEmployeeId).toBe("987654");
    expect(movement.createdByEmployeeId).toBe("987654");
  });
});
