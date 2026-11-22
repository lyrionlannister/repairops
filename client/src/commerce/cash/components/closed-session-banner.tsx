import type { FC } from "react";
import { formatMoney } from "../utils/format";
import type { ClosedSessionBannerProps } from "../props/closed-session-banner-props";

export const ClosedSessionBanner: FC<ClosedSessionBannerProps> = ({ closedSession, onDismiss }) => (
  <div className="relative shrink-0 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
    <button
      type="button"
      onClick={onDismiss}
      className="absolute right-4 top-4 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
    >
      Cerrar
    </button>
    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Caja cerrada</p>
    <div className="mt-3 grid gap-4 sm:grid-cols-3">
      <div>
        <p className="text-xs font-semibold uppercase text-gray-400">Esperado en caja</p>
        <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white/90">
          {formatMoney(Number(closedSession.closingBalance ?? 0) - Number(closedSession.variance ?? 0))}
        </p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase text-gray-400">Contado</p>
        <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white/90">
          {formatMoney(closedSession.closingBalance ?? 0)}
        </p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase text-gray-400">Diferencia</p>
        <p
          className={`mt-1 text-lg font-bold ${Number(closedSession.variance ?? 0) === 0 ? "text-gray-800 dark:text-white/90" : "text-red-500 dark:text-red-400"}`}
        >
          {formatMoney(closedSession.variance ?? 0)}
        </p>
      </div>
    </div>
    {closedSession.varianceReason && (
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Motivo: {closedSession.varianceReason}</p>
    )}
  </div>
);
