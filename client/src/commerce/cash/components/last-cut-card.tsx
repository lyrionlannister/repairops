import type { FC } from "react";
import { CheckCircle2, Printer, X } from "lucide-react";
import { Button } from "@ui/button/button";
import { VarianceBadge } from "./variance-badge";
import { formatDateTime, formatMoney } from "../utils/format";
import type { LastCutCardProps } from "../props/last-cut-card-props";

export const LastCutCard: FC<LastCutCardProps> = ({ cut, justClosed, onPrint, onDismiss }) => (
  <section
    className={`relative rounded-2xl border bg-white p-5 dark:bg-white/3 ${
      justClosed
        ? "border-success-300 dark:border-success-500/40"
        : "border-gray-200 dark:border-gray-800"
    }`}
  >
    {justClosed && (
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Ocultar aviso"
        className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
      >
        <X className="size-4" />
      </button>
    )}
    <div className="flex items-center gap-2">
      {justClosed && <CheckCircle2 className="size-5 text-success-500" aria-hidden />}
      <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
        {justClosed ? "Caja cerrada" : "Último corte"}
      </h2>
    </div>
    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
      {formatDateTime(cut.closedAt)} · {cut.closedByName ?? "—"}
    </p>

    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
      <div>
        <dt className="text-xs text-gray-400">Ingresos</dt>
        <dd className="font-semibold text-success-600 tabular-nums dark:text-success-400">
          {formatMoney(cut.totalIncome)}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-gray-400">Egresos</dt>
        <dd className="font-semibold text-error-500 tabular-nums dark:text-error-400">
          {formatMoney(cut.totalExpense)}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-gray-400">Efectivo contado</dt>
        <dd className="font-semibold text-gray-800 tabular-nums dark:text-white/90">
          {formatMoney(cut.closingBalance)}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-gray-400">Resultado</dt>
        <dd className="mt-0.5">
          <VarianceBadge variance={cut.variance} />
        </dd>
      </div>
    </dl>
    {cut.varianceReason && (
      <p className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">
        Motivo: {cut.varianceReason}
      </p>
    )}

    <Button variant="outline" onClick={() => onPrint(cut.id)} className="mt-4 min-h-11 w-full">
      <Printer className="size-4" />
      Ver e imprimir corte
    </Button>
  </section>
);
