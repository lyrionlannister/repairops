import type { FC } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Lock,
  MapPin,
  Receipt,
  UserRound,
} from "lucide-react";
import { Button } from "@ui/button/button";
import { formatTime } from "../utils/format";
import type { CashShiftCardProps } from "../props/cash-shift-card-props";

export const CashShiftCard: FC<CashShiftCardProps> = ({
  shift,
  branchName,
  onIncome,
  onExpense,
  onClose,
}) => (
  <section className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">Turno en curso</h2>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-400">
        <span className="size-1.5 animate-pulse rounded-full bg-success-500" />
        Caja abierta
      </span>
    </div>

    <dl className="mt-4 space-y-3 text-sm">
      {[
        { icon: UserRound, label: "Abrió", value: shift.openedByName },
        {
          icon: Clock,
          label: "Desde",
          value: `${formatTime(shift.openedAt)} · hace ${shift.elapsed}`,
        },
        { icon: MapPin, label: "Sucursal", value: branchName },
        { icon: Receipt, label: "Movimientos", value: String(shift.movementCount) },
      ].map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
            <Icon className="size-4" aria-hidden />
          </span>
          <dt className="w-24 shrink-0 text-gray-500 dark:text-gray-400">{label}</dt>
          <dd className="truncate font-medium text-gray-800 dark:text-white/90">{value}</dd>
        </div>
      ))}
    </dl>

    <div className="mt-5 grid grid-cols-2 gap-2">
      <Button variant="outline" onClick={onIncome} className="min-h-11">
        <ArrowUpCircle className="size-4 text-success-500" />
        Ingreso
      </Button>
      <Button variant="outline" onClick={onExpense} className="min-h-11">
        <ArrowDownCircle className="size-4 text-error-500" />
        Egreso
      </Button>
      <Button variant="primary" onClick={onClose} className="col-span-2 min-h-11">
        <Lock className="size-4" />
        Hacer corte y cerrar caja
      </Button>
    </div>
  </section>
);
