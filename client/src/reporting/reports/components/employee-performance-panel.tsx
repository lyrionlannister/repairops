import type { FC } from "react";
import { Users } from "lucide-react";
import { EmptyState } from "@ui/table/empty-state";
import { ScrollTable } from "@ui/table/scroll-table";
import { Badge } from "@ui/badge/badge";
import { ReportPanel } from "./report-panel";
import { EmployeeSalaryCell } from "./employee-salary-cell";
import { ATTRIBUTION_LABELS, formatMoney } from "../utils/format";
import type { EmployeePerformancePanelProps } from "../props/employee-performance-panel-props";

const TH = "px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400";
const TD = "px-3 py-3 text-gray-700 dark:text-gray-300";

export const EmployeePerformancePanel: FC<EmployeePerformancePanelProps> = ({
  report,
  currency,
}) => (
  <ReportPanel
    title="Productividad por empleado"
    subtitle={
      report
        ? `Lo que generó cada empleado (${ATTRIBUTION_LABELS[report.attributionBasis] ?? "total cobrado"}) frente a su salario del periodo.`
        : undefined
    }
  >
    {!report || report.employees.length === 0 ? (
      <EmptyState
        icon={<Users />}
        title="Sin empleados en este periodo"
        description="Prueba con otro rango de fechas o sucursal."
      />
    ) : (
      <ScrollTable
        colgroup={
          <colgroup>
            <col className="w-[26%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[18%]" />
            <col className="w-[24%]" />
            <col className="w-[14%]" />
          </colgroup>
        }
        header={
          <tr>
            <th className={TH}>Empleado</th>
            <th className={TH}>Notas</th>
            <th className={TH}>Ventas</th>
            <th className={TH}>Generado</th>
            <th className={TH}>Salario del periodo</th>
            <th className={TH}>Cubre su salario</th>
          </tr>
        }
      >
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {report.employees.map((row) => (
            <tr key={row.employeeId}>
              <td className={`${TD} truncate font-medium text-gray-800 dark:text-white/90`}>
                {row.employeeName}
                {!row.isActive && (
                  <span className="ml-2 text-xs font-normal text-gray-400">(inactivo)</span>
                )}
              </td>
              <td className={`${TD} tabular-nums`}>{row.repairNotesCount}</td>
              <td className={`${TD} tabular-nums`}>{row.salesCount}</td>
              <td className={`${TD} tabular-nums`}>
                {formatMoney(row.attributedAmount, currency)}
              </td>
              <td className={TD}>
                <EmployeeSalaryCell row={row} currency={currency} />
              </td>
              <td className={TD}>
                {row.coversSalary === null ? (
                  <span className="text-gray-400">—</span>
                ) : (
                  <Badge size="sm" color={row.coversSalary ? "success" : "error"}>
                    {row.coversSalary ? "Cubre" : "No cubre"}
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </ScrollTable>
    )}
  </ReportPanel>
);
