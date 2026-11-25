import type { FC } from "react";
import type { ReportPanelProps } from "../props/report-panel-props";

export const ReportPanel: FC<ReportPanelProps> = ({ title, subtitle, children }) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
    <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h2>
    {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
    <div className="mt-4">{children}</div>
  </section>
);
