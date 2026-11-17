import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardService, DashboardValidationError } from "../../../../src/reporting/dashboard/services/dashboard.service.js";
import type { DashboardDao } from "../../../../src/reporting/dashboard/daos/dashboard.dao.js";
import type { LocalService } from "../../../../src/app_platform/local/services/local.service.js";
import type { ChatsService } from "../../../../src/messaging/chats/services/chats.service.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

const store = new Map<string, string>();
vi.mock("../../../../src/core/config/redis-client.js", () => ({
  redisClient: {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => void store.set(key, value)),
  },
}));

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
  return { dao, service: new DashboardService(dao, localService, chatsService) };
}

beforeEach(() => store.clear());

describe("DashboardService permisos", () => {
  it.each(["owner", "admin"] as const)("%s recibe importes", async (role) => {
    const { service } = build();
    const summary = await runWithTenant("1", () => service.getSummary(role));
    expect(summary.money?.today).toBe("100.25");
    expect(summary.activity[0]?.amount).toBe("10.00");
  });

  it.each(["technician", "cashier", "employee"] as const)("%s no recibe ningun importe en el JSON", async (role) => {
    const { service, dao } = build();
    const summary = await runWithTenant("1", () => service.getSummary(role));
    const series = await runWithTenant("1", () => service.getSeries(role, { granularity: "day" }));

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
    const { money } = await runWithTenant("1", () => service.getSummary("owner"));
    expect(money?.todayTrend).toEqual({ pct: 101, up: true });
    expect(money?.monthTrend).toBeNull();
  });

  it("rechaza una sucursal o un año invalidos", async () => {
    const { service } = build();
    await expect(runWithTenant("1", () => service.getSummary("owner", "1; DROP TABLE"))).rejects.toBeInstanceOf(DashboardValidationError);
    await expect(runWithTenant("1", () => service.getSeries("owner", { granularity: "month", year: "1999" }))).rejects.toBeInstanceOf(
      DashboardValidationError,
    );
  });

  it("la serie mensual devuelve cubetas YYYY-MM", async () => {
    const { service } = build();
    const series = await runWithTenant("1", () => service.getSeries("owner", { granularity: "month", year: "2026" }));
    expect(series.business?.[0]?.bucket).toBe("2026-01");
  });
});

describe("DashboardService cache", () => {
  it("la clave lleva el tenant y no mezcla tenants ni roles", async () => {
    const { service, dao } = build();
    await runWithTenant("1", () => service.getSummary("owner"));
    await runWithTenant("1", () => service.getSummary("owner"));
    expect(dao.getOperationalCounts).toHaveBeenCalledTimes(1);

    await runWithTenant("2", () => service.getSummary("owner"));
    expect(dao.getOperationalCounts).toHaveBeenCalledTimes(2);

    await runWithTenant("1", () => service.getSummary("technician"));
    expect(dao.getOperationalCounts).toHaveBeenCalledTimes(3);
    expect([...store.keys()].every((key) => /^dashboard:[12]:/.test(key))).toBe(true);
  });
});
