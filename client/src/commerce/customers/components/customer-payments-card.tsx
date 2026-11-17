import type { FC } from "react";
import { HandCoins } from "lucide-react";
import type { CustomerPaymentRecord } from "../hooks/use-customer-payments";
import { formatDay, formatMoney, METHOD_LABELS } from "../utils/format";

interface CustomerPaymentsCardProps {
  payments: CustomerPaymentRecord[];
}

// Historial de abonos del cliente, junto a sus deudas (CustomerDebtsCard).
export const CustomerPaymentsCard: FC<CustomerPaymentsCardProps> = ({ payments }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Abonos</h3>

    {payments.length === 0 ? (
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Sin abonos registrados.</p>
    ) : (
      <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
        {payments.map((payment) => (
          <li key={payment.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <HandCoins className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{METHOD_LABELS[payment.method]}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDay(payment.createdAt)}</p>
              </div>
            </div>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatMoney(payment.amount)}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);
