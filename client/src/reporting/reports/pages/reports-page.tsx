import { DatePicker } from "@ui/date-picker/date-picker";
import { Label } from "@ui/inputs/label";
import { PageShell } from "@common/components/page-shell/page-shell";

import { useReportsPage } from "../hooks/use-reports-page";
import { ReportSummaryCards } from "../components/report-summary-cards";
import { NotesByTypePanel } from "../components/notes-by-type-panel";
import { CounterSalesPanel } from "../components/counter-sales-panel";
import { EmployeePerformancePanel } from "../components/employee-performance-panel";

export const ReportsPage = () => {
  const {
    employeePerformance,
    accessorySales,
    repairNotesByType,
    summary,
    loading,
    error,
    currency,
    periodStart,
    periodEnd,
    setPeriodStart,
    setPeriodEnd,
  } = useReportsPage();

  return (
    <PageShell
      scrollHeader
      title="Reportes"
      description="Cómo va el negocio en el periodo: reparaciones, ventas y productividad del equipo."
    >
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
        <div className="w-full 2xsm:w-auto">
          <Label className="text-gray-500">Desde</Label>
          <DatePicker value={periodStart} onChange={setPeriodStart} />
        </div>
        <div className="w-full 2xsm:w-auto">
          <Label className="text-gray-500">Hasta</Label>
          <DatePicker value={periodEnd} onChange={setPeriodEnd} />
        </div>
        <p className="min-h-5 text-sm text-gray-400" aria-live="polite">
          {loading ? "Actualizando…" : ""}
        </p>
        {error && (
          <p role="alert" className="w-full text-sm text-error-600 dark:text-error-400">
            {error}
          </p>
        )}
      </div>

      <div className={`flex flex-col gap-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
        <ReportSummaryCards summary={summary} currency={currency} />
        <div className="grid gap-6 lg:grid-cols-2">
          <NotesByTypePanel report={repairNotesByType} currency={currency} />
          <CounterSalesPanel report={accessorySales} currency={currency} />
        </div>
        <EmployeePerformancePanel report={employeePerformance} currency={currency} />
      </div>
    </PageShell>
  );
};
