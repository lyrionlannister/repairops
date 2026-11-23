import type { FC } from "react";
import { ScrollTable } from "@ui/table/scroll-table";
import { formatUsd } from "../utils/format";
import type { WhatsappCostTableProps } from "../props/whatsapp-cost-table-props";

const TH =
  "px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400";
const TD = "px-4 py-4 text-sm text-gray-500 dark:text-gray-400";

export const WhatsappCostTable: FC<WhatsappCostTableProps> = ({ rows, days }) => (
  <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
    <div className="px-5 pt-5 sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Gasto de WhatsApp por taller
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Costo real que Meta cobra a la plataforma, últimos {days} días.
      </p>
    </div>
    {rows.length === 0 ? (
      <p className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        Todavía no hay mensajes con costo confirmado por Meta en este periodo.
      </p>
    ) : (
      <ScrollTable
        header={
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className={TH}>Taller</th>
            <th className={TH}>Mensajes cobrados</th>
            <th className={TH}>Costo (USD)</th>
          </tr>
        }
      >
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.tenantName}
              className="border-b border-gray-100 last:border-0 dark:border-gray-800/50"
            >
              <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                {row.tenantName}
              </td>
              <td className={TD}>{row.messageCount}</td>
              <td className={TD}>{formatUsd(row.totalCostUsd)}</td>
            </tr>
          ))}
        </tbody>
      </ScrollTable>
    )}
  </div>
);
