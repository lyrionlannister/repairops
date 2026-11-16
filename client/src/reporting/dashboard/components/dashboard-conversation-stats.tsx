import type { FC } from "react";
import { Clock, CalendarCheck2, TrendingUp, MessageSquare } from "lucide-react";
import { Select } from "@ui/select/select";

interface DashboardConversationStatsProps {
  lastInteraction: string;
  todayCount: number;
  weekCount: number;
  totalYear: number;
  year: number;
  onYearChange: (year: number) => void;
}

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: String(year), label: String(year) };
});

export const DashboardConversationStats: FC<DashboardConversationStatsProps> = ({
  lastInteraction,
  todayCount,
  weekCount,
  totalYear,
  year,
  onYearChange,
}) => (
  <div>
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">Mensajería</h2>
      <div className="w-28 shrink-0">
        <Select
          value={String(year)}
          onChange={(value) => onYearChange(Number(value))}
          options={YEAR_OPTIONS}
          className="h-9 py-1.5"
        />
      </div>
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
    <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/3 md:p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
        <Clock className="size-6 text-violet-600 dark:text-violet-400" />
      </div>
      <div className="mt-5">
        <span className="text-sm text-gray-500 dark:text-gray-400">Última interacción</span>
        <h4 className="mt-2 text-xl font-bold text-gray-800 dark:text-white/90">{lastInteraction}</h4>
      </div>
    </div>

    <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/3 md:p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
        <CalendarCheck2 className="size-6 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="mt-5">
        <span className="text-sm text-gray-500 dark:text-gray-400">Mensajes hoy</span>
        <h4 className="mt-2 text-xl font-bold text-gray-800 dark:text-white/90">{todayCount}</h4>
      </div>
    </div>

    <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/3 md:p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
        <TrendingUp className="size-6 text-brand-600 dark:text-brand-400" />
      </div>
      <div className="mt-5">
        <span className="text-sm text-gray-500 dark:text-gray-400">Esta semana</span>
        <h4 className="mt-2 text-xl font-bold text-gray-800 dark:text-white/90">{weekCount}</h4>
      </div>
    </div>

    <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/3 md:p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
        <MessageSquare className="size-6 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="mt-5">
        <span className="text-sm text-gray-500 dark:text-gray-400">Total conversaciones {year}</span>
        <h4 className="mt-2 text-xl font-bold text-gray-800 dark:text-white/90">{totalYear}</h4>
      </div>
    </div>
    </div>
  </div>
);
