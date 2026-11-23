import type { FC } from "react";
import { AlertTriangle } from "lucide-react";
import { formatMoney } from "../utils/format";
import {
  OVERDUE_BADGE_TONE,
  OVERDUE_TEXT_TONE,
  hasOverdueCredit,
  hasPendingCredit,
} from "../utils/overdue";
import type { CustomerCreditStatusProps } from "../props/customer-credit-status-props";

export const CustomerCreditStatus: FC<CustomerCreditStatusProps> = ({ customer }) => {
  if (!hasPendingCredit(customer))
    return <span className="text-sm text-gray-400 dark:text-gray-500">—</span>;
  const level = customer.overdueLevel ?? "none";
  return (
    <div className="flex flex-col items-end gap-1 xl:items-center">
      <span className={`text-sm font-semibold ${OVERDUE_TEXT_TONE[level]}`}>
        {formatMoney(Number(customer.creditBalance))}
      </span>
      {hasOverdueCredit(customer) ? (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${OVERDUE_BADGE_TONE[level]}`}
        >
          <AlertTriangle className="size-3" />
          {formatMoney(Number(customer.overdueBalance))} vencido
        </span>
      ) : (
        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          Al corriente
        </span>
      )}
    </div>
  );
};
