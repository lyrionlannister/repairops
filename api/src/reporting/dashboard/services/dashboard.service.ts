import { singleton } from "tsyringe";
import { Decimal } from "decimal.js";
import { DashboardDao, ActivityRow, OperationalCountsRow } from "../daos/dashboard.dao.js";
import { LocalService } from "../../../app_platform/local/services/local.service.js";
import { ChatsService } from "../../../messaging/chats/services/chats.service.js";
import { PresenceService } from "../../../identity/auth/services/presence.service.js";
import {
  CustomerCreditService,
  type CreditPortfolioSummary,
} from "../../../commerce/customers/services/customer-credit.service.js";
import { redisClient } from "../../../core/config/redis-client.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";

const CACHE_TTL_SECONDS = 60;

export class DashboardValidationError extends Error {}

export interface Trend {
  pct: number;
  up: boolean;
}

export interface DashboardSummary {
  timeZone: string;
  counts: {
    openRepairNotes: number;
    criticalStockItems: number;
    openCashSessions: number;
    onlineUsers: number;
  };
  chat: { todayCount: number; weekCount: number; lastAt: string | null };
  activity: Array<Omit<ActivityRow, "amount"> & { amount?: string }>;
  // Solo con dashboard.money: sin ese permiso el campo no existe en el JSON.
  money?: {
    today: string;
    week: string;
    month: string;
    salesToday: string;
    todayTrend: Trend | null;
    monthTrend: Trend | null;
    credit: CreditPortfolioSummary;
  };
}

export interface DashboardSeries {
  granularity: "day" | "month";
  year?: number;
  chat: Array<{ bucket: string; count: number }>;
  // Solo para owner y admin.
  business?: Array<{ bucket: string; sales: string; repairs: string }>;
}

// Porcentaje de cambio con Decimal; sin periodo previo no hay badge (no se inventa un %).
function trendOf(current: string, previous: string): Trend | null {
  const prev = new Decimal(previous);
  if (prev.isZero()) return null;
  const pct = new Decimal(current).minus(prev).dividedBy(prev.abs()).times(100);
  return { pct: Math.round(pct.abs().toNumber()), up: !pct.isNegative() };
}

const localDay = (timeZone: string): string => new Date().toLocaleDateString("en-CA", { timeZone });

@singleton()
export class DashboardService {
  constructor(
    private dashboardDao: DashboardDao,
    private localService: LocalService,
    private chatsService: ChatsService,
    private presenceService: PresenceService,
    private customerCreditService: CustomerCreditService,
  ) {}

  async getSummary(withMoney: boolean, branchId?: string): Promise<DashboardSummary> {
    const branch = this.parseBranch(branchId);
    const { timeZone } = await this.localService.getConfig();

    // Los conectados quedan fuera de la cache de 60 s: un login reciente debe verse al recargar.
    const [summary, onlineUsers] = await Promise.all([
      this.cachedSummary(withMoney, branch, timeZone),
      this.presenceService.countOnline(),
    ]);
    return { ...summary, counts: { ...summary.counts, onlineUsers } };
  }

  private cachedSummary(
    withMoney: boolean,
    branch: string | null,
    timeZone: string,
  ): Promise<Omit<DashboardSummary, "counts"> & { counts: OperationalCountsRow }> {
    return this.cached(
      `summary:${branch ?? "all"}:${localDay(timeZone)}:${withMoney ? "m" : "o"}`,
      async () => {
        const [income, credit, counts, activity, daily, weekCount, lastAt] = await Promise.all([
          withMoney ? this.dashboardDao.getIncomeSummary(timeZone, branch) : Promise.resolve(null),
          withMoney ? this.customerCreditService.getPortfolioSummary() : Promise.resolve(null),
          this.dashboardDao.getOperationalCounts(branch),
          this.dashboardDao.getRecentActivity(branch),
          this.chatsService.getConversationCountsByDay(),
          this.chatsService.getWeekSessionCount(),
          this.chatsService.getLastInteractionAt(),
        ]);

        const summary: Omit<DashboardSummary, "counts"> & { counts: OperationalCountsRow } = {
          timeZone,
          counts,
          chat: { todayCount: daily[daily.length - 1]?.count ?? 0, weekCount, lastAt },
          activity: activity.map(({ amount, ...row }) => (withMoney ? { ...row, amount } : row)),
        };
        if (income && credit) {
          summary.money = {
            today: income.today,
            week: income.week,
            month: income.month,
            salesToday: income.salesToday,
            todayTrend: trendOf(income.today, income.yesterday),
            monthTrend: trendOf(income.month, income.previousMonth),
            credit,
          };
        }
        return summary;
      },
    );
  }

  async getSeries(
    withMoney: boolean,
    query: { granularity?: string; year?: string; branchId?: string },
  ): Promise<DashboardSeries> {
    const branch = this.parseBranch(query.branchId);
    const granularity = query.granularity === "month" ? "month" : "day";
    const { timeZone } = await this.localService.getConfig();

    if (granularity === "day") {
      return this.cached(
        `series:day:${branch ?? "all"}:${localDay(timeZone)}:${withMoney ? "m" : "o"}`,
        async () => {
          const [rows, chat] = await Promise.all([
            withMoney ? this.dashboardDao.getDailySeries(timeZone, branch) : Promise.resolve(null),
            this.chatsService.getConversationCountsByDay(),
          ]);
          return { granularity, chat, ...(rows ? { business: rows } : {}) };
        },
      );
    }

    const year = this.parseYear(query.year, timeZone);
    return this.cached(
      `series:month:${year}:${branch ?? "all"}:${localDay(timeZone)}:${withMoney ? "m" : "o"}`,
      async () => {
        const [rows, chat] = await Promise.all([
          withMoney
            ? this.dashboardDao.getMonthlySeries(timeZone, branch, year)
            : Promise.resolve(null),
          this.chatsService.getConversationCountsByMonth(year),
        ]);
        const business = rows?.map((row) => ({
          bucket: `${year}-${String(row.month).padStart(2, "0")}`,
          sales: row.sales,
          repairs: row.repairs,
        }));
        return { granularity, year, chat, ...(business ? { business } : {}) };
      },
    );
  }

  private parseBranch(branchId: string | undefined): string | null {
    if (!branchId) return null;
    if (!/^\d{1,18}$/.test(branchId)) throw new DashboardValidationError("Sucursal inválida");
    return branchId;
  }

  private parseYear(year: string | undefined, timeZone: string): number {
    if (!year) return Number(localDay(timeZone).slice(0, 4));
    const parsed = Number(year);
    if (!Number.isInteger(parsed) || parsed < 2000 || parsed > 2100)
      throw new DashboardValidationError("Año inválido");
    return parsed;
  }

  // Cache corta sin invalidacion por evento: el dashboard puede ir un minuto
  // atrasado. La clave siempre lleva el tenant; si Redis falla se calcula directo.
  private async cached<T>(suffix: string, compute: () => Promise<T>): Promise<T> {
    const key = `dashboard:${getCurrentTenantId()}:${suffix}`;
    try {
      const hit = await redisClient.get(key);
      if (hit) return JSON.parse(hit) as T;
    } catch {}
    const value = await compute();
    try {
      await redisClient.set(key, JSON.stringify(value), "EX", CACHE_TTL_SECONDS);
    } catch {}
    return value;
  }
}
