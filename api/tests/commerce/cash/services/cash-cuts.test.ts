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
import { effectivePermissions } from "../../../../src/identity/authz/permissions.js";
import type { UserRole } from "../../../../src/identity/auth/entities/user.entity.js";
import { runWithTenant, type RequestActor } from "../../../../src/core/tenancy/tenant-context.js";
import { setupStaff } from "../../../support/staff.js";
import { makeUserRoleDao } from "../../../support/authz-deps.js";

// Integración contra Postgres real: arqueo ciego (montos ocultos al cajero con la caja abierta),
// quién abre/cierra, y cortes (historial e indicadores) aislados por taller.
describe("CashService: cortes y arqueo ciego", () => {
  const tenantA = `${Date.now()}61`;
  const tenantB = `${Date.now()}62`;
  let service: CashService;
  let branchA = "";
  let branchB = "";
  let ownerA = "";
  let cashierA = "";
  let ownerB = "";

  const actor = (userId: string, roles: UserRole[]): RequestActor => ({
    userId,
    roles,
    permissions: effectivePermissions(roles, false),
  });
  const asOwnerA = <T>(fn: () => Promise<T>) =>
    runWithTenant(tenantA, fn, null, actor(ownerA, ["owner"]));
  const asCashierA = <T>(fn: () => Promise<T>) =>
    runWithTenant(tenantA, fn, null, actor(cashierA, ["cashier"]));
  const asOwnerB = <T>(fn: () => Promise<T>) =>
    runWithTenant(tenantB, fn, null, actor(ownerB, ["owner"]));

  beforeAll(async () => {
    await AppDataSource.initialize();
    const staffA = await setupStaff(AppDataSource, tenantA, ["owner", "cashier"]);
    const staffB = await setupStaff(AppDataSource, tenantB, ["owner"]);
    branchA = staffA.branchId;
    branchB = staffB.branchId;
    ownerA = staffA.userIds["owner"]!;
    cashierA = staffA.userIds["cashier"]!;
    ownerB = staffB.userIds["owner"]!;
    service = new CashService(
      new CashSessionDao(AppDataSource.getRepository(CashSession)),
      new CashMovementDao(AppDataSource.getRepository(CashMovement)),
      new LocalService(new LocalDao(AppDataSource.getRepository(Local))),
      new UserDao(AppDataSource.getRepository(User)),
      makeUserRoleDao(),
    );
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("con la caja abierta el cajero ve los totales del turno pero no el desglose de efectivo; el administrador ve todo", async () => {
    const session = await asCashierA(() => service.openSession(branchA, 100));
    await asCashierA(() =>
      service.registerMovement({
        cashSessionId: session.id,
        type: "income",
        method: "efectivo",
        amount: 50,
      }),
    );
    await asCashierA(() =>
      service.registerMovement({
        cashSessionId: session.id,
        type: "income",
        method: "tarjeta",
        amount: 80,
      }),
    );

    const hidden = await asCashierA(() => service.getSummary(session.id));
    expect(hidden?.amountsHidden).toBe(true);
    expect(hidden?.movementCount).toBe(2);
    expect(hidden?.totalIncome).toBe("130.00");
    expect(hidden?.net).toBe("130.00");
    expect(hidden?.hourly).toBeNull();
    expect(hidden?.byMethod.efectivo).toBeNull();
    expect(hidden?.byMethod.tarjeta).toEqual({ income: "80.00", expense: "0.00" });
    expect(hidden?.byOrigin.every((origin) => origin.income === null)).toBe(true);

    const movements = await asCashierA(() => service.getMovements(session.id));
    expect(movements?.find((m) => m.method === "efectivo")?.amount).toBeNull();
    expect(Number(movements?.find((m) => m.method === "tarjeta")?.amount)).toBe(80);

    const full = await asOwnerA(() => service.getSummary(session.id));
    expect(full?.amountsHidden).toBe(false);
    expect(full?.totalIncome).toBe("130.00");
    expect(full?.byMethod.efectivo).toEqual({ income: "50.00", expense: "0.00" });
    expect(full?.hourly?.length).toBe(1);

    const closed = await asCashierA(() => service.closeSession(session.id, 150));
    expect(closed.openedByEmployeeId).toBe(cashierA);
    expect(closed.closedByEmployeeId).toBe(cashierA);

    const afterClose = await asCashierA(() => service.getSummary(session.id));
    expect(afterClose?.amountsHidden).toBe(false);
    expect(afterClose?.totalIncome).toBe("130.00");
  });

  it("los cortes traen totales y nombres, y nunca cruzan de taller", async () => {
    const shortSession = await asOwnerA(() => service.openSession(branchA, 200));
    await asOwnerA(() =>
      service.registerMovement({
        cashSessionId: shortSession.id,
        type: "expense",
        method: "efectivo",
        amount: 20,
      }),
    );
    await asOwnerA(() => service.closeSession(shortSession.id, 170, "Faltó cambio"));

    const foreign = await asOwnerB(() => service.openSession(branchB, 999));
    await asOwnerB(() => service.closeSession(foreign.id, 999));

    const cutsA = await asOwnerA(() => service.getCuts(null));
    expect(cutsA.map((cut) => cut.id)).not.toContain(foreign.id);
    expect(cutsA).toHaveLength(2);

    const latest = cutsA[0]!;
    expect(latest.id).toBe(shortSession.id);
    expect(latest.totalExpense).toBe("20.00");
    expect(latest.variance).toBe("-10.00");
    expect(latest.closedByName).toBe("Test owner");

    const last = await asOwnerA(() => service.getLastCut(branchA));
    expect(last?.id).toBe(shortSession.id);

    const detail = await asCashierA(() => service.getCut(shortSession.id));
    expect(detail?.expectedCash).toBe("180.00");
    expect(detail?.summary.amountsHidden).toBe(false);

    expect(await asOwnerA(() => service.getCut(foreign.id))).toBeNull();
    expect((await asOwnerB(() => service.getCuts(null))).map((cut) => cut.id)).toEqual([
      foreign.id,
    ]);
  });

  it("los indicadores del mes suman faltantes y sobrantes con dinero exacto", async () => {
    const stats = await asOwnerA(() => service.getVarianceStats(null));

    expect(stats.closedCount).toBe(2);
    expect(stats.withVarianceCount).toBe(1);
    expect(stats.shortageTotal).toBe("10.00");
    expect(stats.overageTotal).toBe("0.00");
    expect(stats.netVariance).toBe("-10.00");
    expect(stats.averageIncomePerShift).toBe("65.00");
  });
});
