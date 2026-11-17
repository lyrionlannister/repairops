import { BarChart3 } from "lucide-react";

import { DatePicker } from "@ui/date-picker/date-picker";
import { Label } from "@ui/inputs/label";
import { PageShell } from "@common/components/page-shell/page-shell";

import { useReportsPage } from "../hooks/use-reports-page";
import { STATUS_LABELS, formatMoney } from "../utils/format";

export const ReportsPage = () => {
  const {
    employeePerformance,
    accessorySales,
    repairNotesByType,
    loading,
    session,
    currency,
    periodStart,
    periodEnd,
    setPeriodStart,
    setPeriodEnd,
    cash,
  } = useReportsPage();

  return (
    <PageShell scrollHeader
      title="Reportes"
      description="Productividad, ventas de accesorios y notas por tipo en el período seleccionado."
    >

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
        <div>
          <Label className="text-gray-500">Desde</Label>
          <DatePicker value={periodStart} onChange={setPeriodStart} />
        </div>
        <div>
          <Label className="text-gray-500">Hasta</Label>
          <DatePicker value={periodEnd} onChange={setPeriodEnd} />
        </div>
        {loading && <p className="text-xs text-gray-400">Cargando...</p>}
      </div>

      {/* Caja del día: mismo período que los reportes, para comparar a ojo que cuadran */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Caja de la sesión abierta</h2>
        {!session ? (
          <p className="text-sm text-gray-400">No hay una sesión de caja abierta para este local.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Ingresos en caja</p>
              <p className="mt-1 text-lg font-bold text-green-600 dark:text-green-400">{formatMoney(cash.income, currency)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Reparaciones + accesorios (reporte)</p>
              <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white/90">{formatMoney(cash.expectedTotal, currency)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Diferencia</p>
              <p className={`mt-1 text-lg font-bold ${cash.matches ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                {formatMoney(cash.difference, currency)}
              </p>
            </div>
          </div>
        )}
        <p className="mt-2 text-xs text-gray-400">
          La caja registra pagos por su fecha de movimiento; los reportes de arriba agrupan por fecha de la nota/venta — una diferencia puede ser normal si hay anticipos de días anteriores.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Órdenes de reparación por tipo</h2>
          {!repairNotesByType || repairNotesByType.byType.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos en este período.</p>
          ) : (
            <>
              <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                {repairNotesByType.totalNotes} notas · {formatMoney(repairNotesByType.totalRevenue, currency)}
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="py-2 text-center font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                    <th className="py-2 text-center font-medium text-gray-500 dark:text-gray-400">Notas</th>
                    <th className="py-2 text-center font-medium text-gray-500 dark:text-gray-400">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {repairNotesByType.byType.map((row) => (
                    <tr key={row.type}>
                      <td className="py-2">{row.label}</td>
                      <td className="py-2 text-right tabular-nums">{row.count}</td>
                      <td className="py-2 text-right tabular-nums">{formatMoney(row.totalValue, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h3 className="mt-4 mb-2 text-xs font-semibold uppercase text-gray-400">Por estado</h3>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {repairNotesByType.byStatus.map((row) => (
                    <tr key={row.status}>
                      <td className="py-2">{STATUS_LABELS[row.status] ?? row.status}</td>
                      <td className="py-2 text-right tabular-nums">{row.count}</td>
                      <td className="py-2 text-right tabular-nums">{formatMoney(row.totalValue, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Ventas de accesorios</h2>
          {!accessorySales || accessorySales.data.length === 0 ? (
            <p className="text-sm text-gray-400">Sin ventas en este período.</p>
          ) : (
            <>
              <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                {accessorySales.salesCount} ventas · {formatMoney(accessorySales.totalRevenue, currency)} · ticket promedio{" "}
                {formatMoney(accessorySales.averageTicket, currency)}
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="py-2 text-center font-medium text-gray-500 dark:text-gray-400">Item</th>
                    <th className="py-2 text-center font-medium text-gray-500 dark:text-gray-400">Cantidad</th>
                    <th className="py-2 text-center font-medium text-gray-500 dark:text-gray-400">Ingreso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {accessorySales.data.map((row) => (
                    <tr key={row.key}>
                      <td className="py-2">{row.label}</td>
                      <td className="py-2 text-right tabular-nums">{row.quantity}</td>
                      <td className="py-2 text-right tabular-nums">{formatMoney(row.revenue, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Productividad por empleado</h2>
        {!employeePerformance || employeePerformance.employees.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center text-gray-400">
            <BarChart3 className="size-10 opacity-40" />
            <p className="text-sm">Sin datos en este período.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="py-2 text-center font-medium text-gray-500 dark:text-gray-400">Empleado</th>
                <th className="py-2 text-center font-medium text-gray-500 dark:text-gray-400">Notas</th>
                <th className="py-2 text-center font-medium text-gray-500 dark:text-gray-400">Ventas</th>
                <th className="py-2 text-center font-medium text-gray-500 dark:text-gray-400">Atribuido</th>
                <th className="py-2 text-center font-medium text-gray-500 dark:text-gray-400">Salario del período</th>
                <th className="py-2 text-center font-medium text-gray-500 dark:text-gray-400">Cubre salario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {employeePerformance.employees.map((row) => (
                <tr key={row.employeeId}>
                  <td className="py-2">{row.employeeName}</td>
                  <td className="py-2 text-right tabular-nums">{row.repairNotesCount}</td>
                  <td className="py-2 text-right tabular-nums">{row.salesCount}</td>
                  <td className="py-2 text-right tabular-nums">{formatMoney(row.attributedAmount, currency)}</td>
                  <td className="py-2 text-right tabular-nums">{formatMoney(row.salaryAmount, currency)}</td>
                  <td className="py-2 text-center">
                    <span className={row.coversSalary ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}>
                      {row.coversSalary ? "Sí" : "No"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
};

