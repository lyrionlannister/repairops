import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardService, DashboardValidationError } from "../../../../src/reporting/dashboard/services/dashboard.service.js";
import type { DashboardDao } from "../../../../src/reporting/dashboard/daos/dashboard.dao.js";
import type { LocalService } from "../../../../src/app_platform/local/services/local.service.js";
import type { ChatsService } from "../../../../src/messaging/chats/services/chats.service.js";
import type { PresenceService } from "../../../../src/identity/auth/services/presence.service.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";
import { redisClient } from "../../../../src/core/config/redis-client.js";

const store = new Map<string, string>();

const income = {
  today: "100.25",
  yesterday: "50.00",
  week: "300.00",
  month: "900.00",
  previousMonth: "0.00",
  salesToday: "0.25",
};

function build() {
  const dao = {
    getIncomeSummary: vi.fn().mockResolvedValue(income),
    getOperationalCounts: vi.fn().mockResolvedValue({ openRepairNotes: 4, criticalStockItems: 2, openCashSessions: 1 }),
    getRecentActivity: vi.fn().mockResolvedValue([
      { id: "1", kind: "sale", title: "Venta", subtitle: "Venta", amount: "10.00", occurredAt: "2026-01-01T00:00:00Z" },
    ]),
    getDailySeries: vi.fn().mockResolvedValue([{ bucket: "2026-01-01", sales: "1.00", repairs: "2.00" }]),
    getMonthlySeries: vi.fn().mockResolvedValue([{ month: 1, sales: "1.00", repairs: "2.00" }]),
  } as unknown as DashboardDao;
  const localService = { getConfig: vi.fn().mockResolvedValue({ timeZone: "America/Mexico_City" }) } as unknown as LocalService;
  const chatsService = {
    getConversationCountsByDay: vi.fn().mockResolvedValue([{ bucket: "2026-01-01", count: 3 }]),
    getConversationCountsByMonth: vi.fn().mockResolvedValue([]),
    getWeekSessionCount: vi.fn().mockResolvedValue(5),
    getLastInteractionAt: vi.fn().mockResolvedValue(null),
  } as unknown as ChatsService;
  const presenceService = { countOnline: vi.fn().mockResolvedValue(2) } as unknown as PresenceService;
  return { dao, service: new DashboardService(dao, localService, chatsService, presenceService) };
}

// spyOn sobre la instancia real en vez de vi.mock del modulo: con el pool vmThreads el
// vi.mock a veces no se aplica y el cliente real se cuelga intentando conectar a "redis".
beforeEach(() => {
  store.clear();
  vi.spyOn(redisClient, "get").mockImplementation((async (key: string) => store.get(key) ?? null) as never);
  vi.spyOn(redisClient, "set").mockImplementation((async (key: string, value: string) => {
    store.set(key, value);
    return "OK";
  }) as never);
});

describe("DashboardService permisos", () => {
  it("con dashboard.money recibe importes", async () => {
    const { service } = build();
    const summary = await runWithTenant("1", () => service.getSummary(true));
    expect(summary.money?.today).toBe("100.25");
    expect(summary.activity[0]?.amount).toBe("10.00");
  });

  it("sin dashboard.money no recibe ningun importe en el JSON", async () => {
    const { service, dao } = build();
    const summary = await runWithTenant("1", () => service.getSummary(false));
    const series = await runWithTenant("1", () => service.getSeries(false, { granularity: "day" }));

    expect("money" in summary).toBe(false);
    expect(summary.activity[0]).not.toHaveProperty("amount");
    expect(summary.counts.openRepairNotes).toBe(4);
    expect("business" in series).toBe(false);
    expect(series.chat).toHaveLength(1);
    expect(dao.getIncomeSummary).not.toHaveBeenCalled();
    expect(JSON.stringify([summary, series])).not.toMatch(/100\.25|"sales"|"repairs"/);
  });
});

describe("DashboardService tendencias y validaciones", () => {
  it("calcula la tendencia con Decimal y omite el badge sin periodo previo", async () => {
    const { service } = build();
    const { money } = await runWithTenant("1", () => service.getSummary(true));
    expect(money?.todayTrend).toEqual({ pct: 101, up: true });
    expect(money?.monthTrend).toBeNull();
  });

  it("rechaza una sucursal o un año invalidos", async () => {
    const { service } = build();
    await expect(runWithTenant("1", () => service.getSummary(true, "1; DROP TABLE"))).rejects.toBeInstanceOf(DashboardValidationError);
    await expect(runWithTenant("1", () => service.getSeries(true, { granularity: "month", year: "1999" }))).rejects.toBeInstanceOf(
      DashboardValidationError,
    );
  });

  it("la serie mensual devuelve cubetas YYYY-MM", async () => {
    const { service } = build();
    const series = await runWithTenant("1", () => service.getSeries(true, { granularity: "month", year: "2026" }));
    expect(series.business?.[0]?.bucket).toBe("2026-01");
  });
});

describe("DashboardService cache", () => {
  it("la clave lleva el tenant y no mezcla tenants ni vistas con y sin importes", async () => {
    const { service, dao } = build();
    await runWithTenant("1", () => service.getSummary(true));
    await runWithTenant("1", () => service.getSummary(true));
    expect(dao.getOperationalCounts).toHaveBeenCalledTimes(1);

    await runWithTenant("2", () => service.getSummary(true));
    expect(dao.getOperationalCounts).toHaveBeenCalledTimes(2);

    await runWithTenant("1", () => service.getSummary(false));
    expect(dao.getOperationalCounts).toHaveBeenCalledTimes(3);
    expect([...store.keys()].every((key) => /^dashboard:[12]:/.test(key))).toBe(true);
  });
});
