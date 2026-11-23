import type { FC } from "react";
import { Badge } from "@ui/badge/badge";
import { Button } from "@ui/button/button";
import { CashStat } from "./cash-stat";
import { VarianceBadge } from "./variance-badge";
import { formatDateTime, formatMoney } from "../utils/format";
import type { CashBranchCardProps } from "../props/cash-branch-card-props";

export const CashBranchCard: FC<CashBranchCardProps> = ({ status, onView }) => {
  const { session, summary, lastCut } = status;
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-gray-800 dark:text-white/90">
            {status.branchName}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {session
              ? `Abierta desde ${formatDateTime(session.openedAt)}`
              : lastCut
                ? `Último corte Nº ${lastCut.cutNumber} · ${formatDateTime(lastCut.closedAt)}`
                : "Sin cortes todavía"}
          </p>
        </div>
        <Badge color={session ? "success" : "light"} size="sm">
          {session ? "Abierta" : "Cerrada"}
        </Badge>
      </header>

      {session ? (
        <div className="grid grid-cols-2 gap-3">
          <CashStat label="Fondo inicial" value={formatMoney(session.openingBalance)} />
          <CashStat label="Movimientos" value={String(summary?.movementCount ?? 0)} />
          <CashStat
            label="Ingresos"
            value={summary?.amountsHidden ? "Oculto" : formatMoney(summary?.totalIncome)}
          />
          <CashStat
            label="Egresos"
            value={summary?.amountsHidden ? "Oculto" : formatMoney(summary?.totalExpense)}
          />
        </div>
      ) : lastCut ? (
        <div className="grid grid-cols-2 gap-3">
          <CashStat label="Efectivo al cierre" value={formatMoney(lastCut.closingBalance)} />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Diferencia</p>
            <div className="mt-1">
              <VarianceBadge variance={lastCut.variance} />
            </div>
          </div>
          <CashStat label="Ingresos del turno" value={formatMoney(lastCut.totalIncome)} />
          <CashStat label="Cerró" value={lastCut.closedByName ?? "—"} />
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Esta sucursal todavía no abre caja.
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        className="mt-auto w-full"
        onClick={() => onView(status.branchId)}
      >
        Ver caja
      </Button>
    </article>
  );
};
