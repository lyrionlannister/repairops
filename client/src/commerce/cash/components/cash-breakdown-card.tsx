import type { FC } from "react";
import { formatMoney } from "../utils/format";
import type { CashBreakdownCardProps } from "../props/cash-breakdown-card-props";

export const CashBreakdownCard: FC<CashBreakdownCardProps> = ({
  title,
  subtitle,
  rows,
  emptyText,
}) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
    <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>

    {rows.length === 0 ? (
      <p className="mt-4 text-sm text-gray-400">{emptyText}</p>
    ) : (
      <ul className="mt-4 space-y-4">
        {rows.map((row) => (
          <li key={row.key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {row.label}
                {row.count !== null && (
                  <span className="ml-1.5 text-xs font-normal text-gray-400">{row.count} mov.</span>
                )}
              </span>
              <span className="text-right text-xs tabular-nums">
                {row.income === null ? (
                  <span className="text-gray-400">Oculto</span>
                ) : (
                  <>
                    <span className="text-success-600 dark:text-success-400">
                      +{formatMoney(row.income)}
                    </span>
                    {row.expense !== null && row.expense !== "0.00" && (
                      <span className="ml-2 text-error-500 dark:text-error-400">
                        −{formatMoney(row.expense)}
                      </span>
                    )}
                  </>
                )}
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${row.share}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    )}
  </section>
);
