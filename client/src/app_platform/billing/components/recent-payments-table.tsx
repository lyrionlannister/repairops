import type { FC } from "react";
import { ScrollTable } from "@ui/table/scroll-table";
import { Badge } from "@ui/badge/badge";
import { formatMoney, formatPaidAt, intervalLabel, planLabel } from "../utils/format";
import type { RecentPaymentsTableProps } from "../props/recent-payments-table-props";

const TH =
  "px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400";
const TD = "px-4 py-4 text-sm text-gray-500 dark:text-gray-400";

export const RecentPaymentsTable: FC<RecentPaymentsTableProps> = ({ payments }) => (
  <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
    <div className="px-5 pt-5 sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Pagos recientes</h3>
    </div>
    {payments.length === 0 ? (
      <p className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        Todavía no hay pagos cobrados.
      </p>
    ) : (
      <ScrollTable
        header={
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className={TH}>Taller</th>
            <th className={TH}>Plan</th>
            <th className={TH}>Monto</th>
            <th className={TH}>Fecha</th>
            <th className={TH}>Estado</th>
          </tr>
        }
      >
        <tbody>
          {payments.map((payment, index) => (
            <tr
              key={index}
              className="border-b border-gray-100 last:border-0 dark:border-gray-800/50"
            >
              <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                {payment.tenantName}
              </td>
              <td className={TD}>
                {planLabel(payment.planKey)} ({intervalLabel(payment.billingInterval)})
              </td>
              <td className={TD}>{formatMoney(payment.amount)}</td>
              <td className={TD}>{formatPaidAt(payment.paidAt)}</td>
              <td className="px-4 py-4 text-center">
                <Badge color="success" size="sm">
                  Pagado
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </ScrollTable>
    )}
  </div>
);
