import { useApiClient } from "@common/hooks/use-api-client";
import { useBranch } from "@common/hooks/use-branch";
import { ALL_BRANCHES } from "@common/contexts/branch-context";
import { useCallback, useEffect, useMemo, useState } from "react";

import { dayLabel, formatLastInteraction, toChartValue } from "../utils/dashboard-metrics";
import type { SummaryResponse, SeriesResponse, BusinessSeriesPoint, ActivityItem } from "../types/dashboard-page";

// Respuesta de GET /dashboard/summary. Los importes llegan como cadenas decimales.
const MONTH_LABELS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const EMPTY_COUNTS = { openRepairNotes: 0, criticalStockItems: 0, openCashSessions: 0, onlineUsers: 0 };

// Dos peticiones al cargar (resumen y serie diaria) más la serie mensual del año
// elegido; todo el cálculo (zona horaria del taller, dinero cobrado) ya viene hecho.
export const useDashboardPage = () => {
  const { apiClient } = useApiClient();
  const { activeBranchId } = useBranch();
  const year = new Date().getFullYear();
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [daily, setDaily] = useState<SeriesResponse | null>(null);
  const [monthly, setMonthly] = useState<SeriesResponse | null>(null);

  const load = useCallback(
    async <T,>(path: string, set: (value: T) => void) => {
      const response = await apiClient(path);
      if (response.ok) set((await response.json()) as T);
    },
    [apiClient],
  );

  // "Todas" (solo owner) no manda branchId: el API suma todas las sucursales.
  const branchQuery =
    activeBranchId && activeBranchId !== ALL_BRANCHES ? `&branchId=${encodeURIComponent(activeBranchId)}` : "";

  useEffect(() => {
    load<SummaryResponse>(`/dashboard/summary?${branchQuery.slice(1)}`, setSummary).catch(console.error);
    load<SeriesResponse>(`/dashboard/series?granularity=day${branchQuery}`, setDaily).catch(console.error);
  }, [load, branchQuery]);

  useEffect(() => {
    load<SeriesResponse>(`/dashboard/series?granularity=month&year=${year}${branchQuery}`, setMonthly).catch(console.error);
  }, [load, year, branchQuery]);

  const showMoney = Boolean(summary?.money);

  const businessMetrics = useMemo(
    () => ({
      todayRevenue: summary?.money?.today ?? "0",
      weeklyRevenue: summary?.money?.week ?? "0",
      monthlyRevenue: summary?.money?.month ?? "0",
      ...(summary?.counts ?? EMPTY_COUNTS),
    }),
    [summary],
  );

  const dailyBusinessSeries = useMemo<BusinessSeriesPoint[]>(
    () => (daily?.business ?? []).map((p) => ({ bucket: p.bucket, sales: toChartValue(p.sales), repairs: toChartValue(p.repairs) })),
    [daily],
  );

  const monthlyBusinessSeries = useMemo(() => {
    const months = monthly?.business ?? [];
    return {
      salesData: months.map((m) => toChartValue(m.sales)),
      repairsData: months.map((m) => toChartValue(m.repairs)),
    };
  }, [monthly]);

  const dailyChat = useMemo(() => daily?.chat ?? [], [daily]);
  const monthlyChat = useMemo(() => monthly?.chat ?? [], [monthly]);

  const recentActivity = useMemo<ActivityItem[]>(
    () => (summary?.activity ?? []).map((item) => ({ ...item, date: item.occurredAt })),
    [summary],
  );

  return {
    daily: dailyChat,
    monthly: monthlyChat,
    weekCount: summary?.chat.weekCount ?? 0,
    todayCount: summary?.chat.todayCount ?? 0,
    lastInteraction: formatLastInteraction(summary?.chat.lastAt ?? null),
    totalYear: useMemo(() => monthlyChat.reduce((sum, point) => sum + point.count, 0), [monthlyChat]),
    dailyCategories: useMemo(() => dailyChat.map((p) => dayLabel(p.bucket)), [dailyChat]),
    dailyBusinessCategories: useMemo(() => dailyBusinessSeries.map((p) => dayLabel(p.bucket)), [dailyBusinessSeries]),
    monthLabels: MONTH_LABELS,
    year,
    showMoney,
    businessMetrics,
    dailyBusinessSeries,
    monthlyBusinessSeries,
    todayDelta: summary?.money?.todayTrend ?? null,
    monthDelta: summary?.money?.monthTrend ?? null,
    credit: summary?.money?.credit ?? null,
    recentActivity,
  };
};
