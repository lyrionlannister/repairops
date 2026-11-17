import type { FC } from "react";
import { Clock, CalendarCheck2, TrendingUp, MessageSquare } from "lucide-react";
import { StatCard } from "./stat-card";

interface DashboardConversationStatsProps {
  lastInteraction: string;
  todayCount: number;
  weekCount: number;
  totalYear: number;
  year: number;
}

export const DashboardConversationStats: FC<DashboardConversationStatsProps> = ({
  lastInteraction,
  todayCount,
  weekCount,
  totalYear,
  year,
}) => (
  <section>
    <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">Mensajería</h2>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
      <StatCard icon={<Clock />} iconTone="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" label="Última interacción" value={lastInteraction} />
      <StatCard icon={<CalendarCheck2 />} iconTone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" label="Mensajes hoy" value={todayCount} />
      <StatCard icon={<TrendingUp />} iconTone="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400" label="Esta semana" value={weekCount} />
      <StatCard icon={<MessageSquare />} iconTone="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" label={`Conversaciones ${year}`} value={totalYear} />
    </div>
  </section>
);
