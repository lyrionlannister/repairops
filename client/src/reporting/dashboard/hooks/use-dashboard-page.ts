import { useApiClient } from "@common/hooks/use-api-client";
import { useCallback, useEffect, useMemo, useState } from "react";

import { buildDailyBusinessSeries, buildMonthlyBusinessSeries, summarizeDashboardMetrics } from "../utils/dashboard-metrics";

export type Point = { bucket: string; count: number };

export type Trend = { pct: number; up: boolean };

export type ActivityItem = {
  id: string;
  kind: "sale" | "repair";
  title: string;
  subtitle: string;
  amount: number;
  date: string;
};

const REPAIR_STATUS_LABELS: Record<string, string> = {
  received: "Recibido",
  in_repair: "En reparación",
  done: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const toStr = (value: unknown): string => (typeof value === "string" ? value : "");
const toNum = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

// shortcut: pct de cambio no definido cuando el periodo previo es 0 (division
// por cero); en ese caso se omite el badge en vez de mostrar un % inventado.
const computeTrend = (current: number, previous: number): Trend | null => {
  if (!previous) return null;
  const pct = ((current - previous) / previous) * 100;
  return { pct: Math.round(Math.abs(pct)), up: current >= previous };
};

const MONTH_LABELS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export const useDashboardPage = () => {
  const { apiClient } = useApiClient();
  const [daily, setDaily] = useState<Point[]>([]);
  const [monthly, setMonthly] = useState<Point[]>([]);
  const [weekCount, setWeekCount] = useState(0);
  const [lastAt, setLastAt] = useState<string | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [businessMetrics, setBusinessMetrics] = useState(() =>
    summarizeDashboardMetrics([], [], [], []),
  );
  const [repairNotes, setRepairNotes] = useState<Array<Record<string, unknown>>>([]);
  const [sales, setSales] = useState<Array<Record<string, unknown>>>([]);

  const loadStats = useCallback(async () => {
    const [dailyRes, monthlyRes, weekRes, lastRes] = await Promise.all([
      apiClient("/chats/stats/daily"),
      apiClient(`/chats/stats/monthly?year=${year}`),
      apiClient("/chats/stats/weekly"),
      apiClient("/chats/stats/last-interaction"),
    ]);

    if (dailyRes.ok) setDaily((await dailyRes.json()) as Point[]);
    if (monthlyRes.ok) setMonthly((await monthlyRes.json()) as Point[]);
    if (weekRes.ok) setWeekCount(((await weekRes.json()) as { count: number }).count);
    if (lastRes.ok) setLastAt(((await lastRes.json()) as { lastAt: string | null }).lastAt);
  }, [apiClient, year]);

  const loadBusinessStats = useCallback(async () => {
    const [repairNotesRes, salesRes, inventoryRes, cashSessionsRes] = await Promise.all([
      apiClient("/repair-notes"),
      apiClient("/sales"),
      apiClient("/inventory"),
      apiClient("/cash/sessions"),
    ]);

    const repairNotesData = repairNotesRes.ok ? ((await repairNotesRes.json()) as Array<Record<string, unknown>>) : [];
    const salesData = salesRes.ok ? ((await salesRes.json()) as Array<Record<string, unknown>>) : [];
    const inventory = inventoryRes.ok ? ((await inventoryRes.json()) as Array<Record<string, unknown>>) : [];
    const cashSessions = cashSessionsRes.ok ? ((await cashSessionsRes.json()) as Array<Record<string, unknown>>) : [];

    setRepairNotes(repairNotesData);
    setSales(salesData);
    setBusinessMetrics(
      summarizeDashboardMetrics(
        repairNotesData as Parameters<typeof summarizeDashboardMetrics>[0],
        salesData as Parameters<typeof summarizeDashboardMetrics>[1],
        inventory as Parameters<typeof summarizeDashboardMetrics>[2],
        cashSessions as Parameters<typeof summarizeDashboardMetrics>[3],
      ),
    );
  }, [apiClient]);

  useEffect(() => {
    loadStats().catch(console.error);
    loadBusinessStats().catch(console.error);
  }, [loadBusinessStats, loadStats]);

  const totalYear = useMemo(() => monthly.reduce((sum, point) => sum + point.count, 0), [monthly]);

  const todayCount = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return daily.find((point) => point.bucket === today)?.count ?? 0;
  }, [daily]);

  const lastInteraction = useMemo(() => {
    if (!lastAt) return "Sin datos";
    const date = new Date(lastAt);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
  }, [lastAt]);

  const dailyCategories = useMemo(
    () => daily.map((point) => {
      const [, mm, dd] = point.bucket.split("-");
      return `${dd}/${mm}`;
    }),
    [daily],
  );

  const dailyBusinessSeries = useMemo(
    () => buildDailyBusinessSeries(repairNotes as Parameters<typeof buildDailyBusinessSeries>[0], sales as Parameters<typeof buildDailyBusinessSeries>[1]),
    [repairNotes, sales],
  );

  const dailyBusinessCategories = useMemo(
    () => dailyBusinessSeries.map((p) => {
      const [, mm, dd] = p.bucket.split("-");
      return `${dd}/${mm}`;
    }),
    [dailyBusinessSeries],
  );

  const monthlyBusinessSeries = useMemo(
    () => buildMonthlyBusinessSeries(repairNotes as Parameters<typeof buildMonthlyBusinessSeries>[0], sales as Parameters<typeof buildMonthlyBusinessSeries>[1], year),
    [repairNotes, sales, year],
  );

  // Hoy vs. ayer: siempre comparable, dailyBusinessSeries trae 30 dias fijos.
  const todayDelta = useMemo(() => {
    if (dailyBusinessSeries.length < 2) return null;
    const today = dailyBusinessSeries[dailyBusinessSeries.length - 1];
    const yesterday = dailyBusinessSeries[dailyBusinessSeries.length - 2];
    return computeTrend(today.sales + today.repairs, yesterday.sales + yesterday.repairs);
  }, [dailyBusinessSeries]);

  // Este mes vs. mes anterior: solo si el filtro de año es el actual y no es
  // enero (el mes anterior caeria en otro anio, fuera de monthlyBusinessSeries).
  const monthDelta = useMemo(() => {
    const now = new Date();
    if (year !== now.getFullYear()) return null;
    const monthIndex = now.getMonth();
    if (monthIndex === 0) return null;
    const current = monthlyBusinessSeries.salesData[monthIndex] + monthlyBusinessSeries.repairsData[monthIndex];
    const previous = monthlyBusinessSeries.salesData[monthIndex - 1] + monthlyBusinessSeries.repairsData[monthIndex - 1];
    return computeTrend(current, previous);
  }, [year, monthlyBusinessSeries]);

  const recentActivity = useMemo<ActivityItem[]>(() => {
    const saleItems: ActivityItem[] = sales.map((sale) => ({
      id: toStr(sale.id) || `sale-${toStr(sale.saleNumber)}`,
      kind: "sale",
      title: toStr(sale.customerName) || `Venta #${toStr(sale.saleNumber)}`,
      subtitle: "Venta",
      amount: toNum(sale.totalValue),
      date: toStr(sale.createdAt),
    }));
    const repairItems: ActivityItem[] = repairNotes.map((note) => ({
      id: toStr(note.id) || `repair-${toStr(note.controlNumber)}`,
      kind: "repair",
      title: toStr(note.customerName) || `Nota #${toStr(note.controlNumber)}`,
      subtitle: REPAIR_STATUS_LABELS[toStr(note.status)] ?? toStr(note.status),
      amount: toNum(note.totalValue),
      date: toStr(note.receivedAt) || toStr(note.createdAt),
    }));

    return [...saleItems, ...repairItems]
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [sales, repairNotes]);

  return {
    daily,
    monthly,
    weekCount,
    lastAt,
    year,
    businessMetrics,
    totalYear,
    todayCount,
    lastInteraction,
    dailyCategories,
    monthLabels: MONTH_LABELS,
    setYear,
    dailyBusinessSeries,
    dailyBusinessCategories,
    monthlyBusinessSeries,
    todayDelta,
    monthDelta,
    recentActivity,
  };
};
