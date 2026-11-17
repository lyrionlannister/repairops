import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { CashMovement } from "../../../../src/commerce/cash/entities/cash-movement.entity.js";
import { Tenant } from "../../../../src/core/tenancy/entities/tenant.entity.js";
import { DashboardDao } from "../../../../src/reporting/dashboard/daos/dashboard.dao.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

const TZ = "America/Mexico_City";

// Integracion contra Postgres real. Las tablas de caja no tienen FK a tenants
// (ver SPEC-cleanup), asi que se limpian a mano por tenant_id.
describe("DashboardDao", () => {
  let dao: DashboardDao;
  let tenantA: string;
  let tenantB: string;
  let sessionA1: string;
  let sessionA2: string;
  let sessionB: string;

  const run = (sql: string, params: unknown[] = []) => AppDataSource.query(sql, params);

  const addSession = async (tenantId: string, localId: string): Promise<string> =>
    (
      await run(
        `INSERT INTO cash_sessions (tenant_id, local_id, saldo_apertura, estado) VALUES ($1, $2, 0, 'open') RETURNING id::text AS id`,
        [tenantId, localId],
      )
    )[0].id;

  // `when` es una expresion SQL (timestamptz), para fijar el instante exacto.
  const addMovement = (
    tenantId: string,
    sessionId: string,
    type: "income" | "expense",
    amount: string,
    entity: string,
    when = "now()",
  ) =>
    run(
      `INSERT INTO cash_movements (tenant_id, id_sesion_caja, tipo, metodo, monto, tipo_entidad_relacionada, fecha_creacion)
       VALUES ($1, $2, $3, 'efectivo', $4, $5, ${when})`,
      [tenantId, sessionId, type, amount, entity],
    );

  const localDayStart = `(date_trunc('day', now() AT TIME ZONE '${TZ}') AT TIME ZONE '${TZ}')`;

  beforeAll(async () => {
    await AppDataSource.initialize();
    dao = new DashboardDao(AppDataSource.getRepository(CashMovement));
    const tenants = AppDataSource.getRepository(Tenant);
    tenantA = (await tenants.save(tenants.create({ name: "dashboard-test-a" }))).id;
    tenantB = (await tenants.save(tenants.create({ name: "dashboard-test-b" }))).id;
    sessionA1 = await addSession(tenantA, "9001");
    sessionA2 = await addSession(tenantA, "9002");
    sessionB = await addSession(tenantB, "9001");

    // Tenant A, sucursal 9001: dos cobros que suman centavos, una devolucion, un gasto manual.
    await addMovement(tenantA, sessionA1, "income", "0.10", "sale");
    await addMovement(tenantA, sessionA1, "income", "0.20", "sale");
    await addMovement(tenantA, sessionA1, "income", "100.00", "repair_note");
    await addMovement(tenantA, sessionA1, "expense", "0.05", "return");
    await addMovement(tenantA, sessionA1, "expense", "40.00", "manual");
    // Sucursal 9002: un cobro de nota.
    await addMovement(tenantA, sessionA2, "income", "50.00", "repair_note");
    // Ayer a las 23:30 hora local (ya es hoy en UTC): debe caer en el dia de ayer local.
    await addMovement(tenantA, sessionA1, "income", "7.00", "sale", `${localDayStart} - INTERVAL '30 minutes'`);
    // Otro tenant: nunca debe mezclarse.
    await addMovement(tenantB, sessionB, "income", "999.00", "sale");
  });

  afterAll(async () => {
    for (const table of ["cash_movements", "cash_sessions"]) {
      await run(`DELETE FROM ${table} WHERE tenant_id = ANY($1::bigint[])`, [[tenantA, tenantB]]);
    }
    await AppDataSource.getRepository(Tenant).delete([tenantA, tenantB]);
    await AppDataSource.destroy();
  });

  it("suma centavos exactos y resta devoluciones, no gastos manuales", async () => {
    const summary = await runWithTenant(tenantA, () => dao.getIncomeSummary(TZ, "9001"));
    // 0.10 + 0.20 + 100.00 - 0.05 (devolucion) = 100.25; el gasto manual de 40 no resta.
    expect(summary.today).toBe("100.25");
    expect(summary.salesToday).toBe("0.25");
  });

  it("sin sucursal suma todas las sucursales del tenant", async () => {
    const summary = await runWithTenant(tenantA, () => dao.getIncomeSummary(TZ, null));
    expect(summary.today).toBe("150.25");
  });

  it("un cobro de las 23:30 hora local cuenta como de ayer aunque en UTC ya sea hoy", async () => {
    const summary = await runWithTenant(tenantA, () => dao.getIncomeSummary(TZ, "9001"));
    expect(summary.yesterday).toBe("7.00");

    const series = await runWithTenant(tenantA, () => dao.getDailySeries(TZ, "9001"));
    expect(series).toHaveLength(30);
    const [yesterday, today] = series.slice(-2);
    expect(yesterday?.sales).toBe("7.00");
    expect(today?.sales).toBe("0.25");
    expect(today?.repairs).toBe("100.00");
  });

  it("aisla los tenants", async () => {
    const summary = await runWithTenant(tenantB, () => dao.getIncomeSummary(TZ, null));
    expect(summary.today).toBe("999.00");
    const counts = await runWithTenant(tenantB, () => dao.getOperationalCounts(null));
    expect(counts.openCashSessions).toBe(1);
  });

  it("la serie mensual agrupa en la zona del tenant y rellena los 12 meses", async () => {
    const year = Number((await run(`SELECT EXTRACT(YEAR FROM now() AT TIME ZONE '${TZ}')::int AS y`))[0].y);
    const months = await runWithTenant(tenantA, () => dao.getMonthlySeries(TZ, null, year));
    expect(months).toHaveLength(12);
    expect(months.every((m) => /^\d+\.\d{2}$/.test(m.sales))).toBe(true);
  });

  it("la actividad reciente trae a lo mas 10 movimientos del tenant", async () => {
    const activity = await runWithTenant(tenantA, () => dao.getRecentActivity(null, 10));
    expect(activity.length).toBeLessThanOrEqual(10);
    expect(activity.length).toBeGreaterThan(0);
  });

  it("la semana empieza en lunes", async () => {
    const { rows } = { rows: await run(`SELECT EXTRACT(ISODOW FROM date_trunc('week', now() AT TIME ZONE '${TZ}'))::int AS d`) };
    expect(rows[0].d).toBe(1);
  });
});
