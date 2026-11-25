import type { FC } from "react";
import { PAY_CYCLE_SHORT, formatMoney } from "../utils/format";
import type { EmployeePerformanceCellProps } from "../props/employee-performance-panel-props";

export const EmployeeSalaryCell: FC<EmployeePerformanceCellProps> = ({ row, currency }) => {
  if (row.missingPayCycle) {
    return (
      <span className="text-warning-600 dark:text-warning-400">Falta elegir el ciclo de pago</span>
    );
  }
  if (row.salaryAmount === null)
    return <span className="text-gray-400">Sin salario registrado</span>;
  return (
    <span className="tabular-nums">
      {formatMoney(row.salaryAmount, currency)}
      {row.payCycle && (
        <span className="ml-1 text-xs text-gray-400">({PAY_CYCLE_SHORT[row.payCycle]})</span>
      )}
    </span>
  );
};
