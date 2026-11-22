import type { FC } from "react";
import { CheckCircle2, HandCoins, Receipt, Wrench } from "lucide-react";
import { formatDay, formatMoney } from "../utils/format";
import { Button } from "@ui/button/button";
import type { CustomerDebtsCardProps } from "../props/customer-debts-card-props";

// Deudas: cada venta o nota que se dejó (en parte) a crédito. "balance" ya
// resta los abonos registrados (ver CustomerPaymentsCard, junto a esta).
export const CustomerDebtsCard: FC<CustomerDebtsCardProps> = ({ debts, balance, onRegisterPayment }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Deudas</h3>
      <div className="flex items-center gap-2">
        {balance > 0 && (
          <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
            Debe {formatMoney(balance)}
          </span>
        )}
        <Button type="button" variant="outline" startIcon={<HandCoins className="size-4" />} onClick={onRegisterPayment} disabled={balance <= 0}>
          Registrar abono
        </Button>
      </div>
    </div>

    {debts.length === 0 ? (
      <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center text-gray-400">
        <CheckCircle2 className="size-8 text-emerald-500" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Sin deudas: no tiene nada pendiente a crédito.</p>
      </div>
    ) : (
      <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
        {debts.map((debt) => (
          <li key={`${debt.kind}-${debt.reference}-${debt.date}`} className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                {debt.kind === "sale" ? <Receipt className="size-4" /> : <Wrench className="size-4" />}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {debt.kind === "sale" ? "Venta" : "Nota"} #{debt.reference}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDay(debt.date)}</p>
              </div>
            </div>
            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{formatMoney(Number(debt.amount))}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);
