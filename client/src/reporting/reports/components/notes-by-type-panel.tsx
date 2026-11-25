import type { FC } from "react";
import { Wrench } from "lucide-react";
import { EmptyState } from "@ui/table/empty-state";
import { ReportPanel } from "./report-panel";
import { STATUS_LABELS, formatMoney } from "../utils/format";
import type { NotesByTypePanelProps } from "../props/notes-by-type-panel-props";

const ROW = "flex items-center justify-between gap-3 py-2.5 text-sm";
const LABEL = "min-w-0 truncate text-gray-700 dark:text-gray-300";
const META = "shrink-0 text-gray-500 tabular-nums dark:text-gray-400";
const AMOUNT = "font-medium text-gray-800 dark:text-white/90";

export const NotesByTypePanel: FC<NotesByTypePanelProps> = ({ report, currency }) => (
  <ReportPanel
    title="Reparaciones por tipo de servicio"
    subtitle="Cantidad de notas y su valor. No incluye canceladas."
  >
    {!report || report.byStatus.length === 0 ? (
      <EmptyState
        icon={<Wrench />}
        title="Sin reparaciones en este periodo"
        description="Prueba con otro rango de fechas."
      />
    ) : (
      <>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {report.byType.map((row) => (
            <li key={row.type} className={ROW}>
              <span className={LABEL}>{row.label}</span>
              <span className={META}>
                {row.count} ·{" "}
                <span className={AMOUNT}>{formatMoney(row.totalValue, currency)}</span>
              </span>
            </li>
          ))}
          {report.byType.length === 0 && (
            <li className={`${ROW} text-gray-400`}>
              Las notas del periodo no tienen tipo de servicio asignado.
            </li>
          )}
        </ul>
        <h3 className="mt-5 mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
          Por estado
        </h3>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {report.byStatus.map((row) => (
            <li key={row.status} className={ROW}>
              <span className={LABEL}>{STATUS_LABELS[row.status] ?? row.status}</span>
              <span className={META}>
                {row.count} ·{" "}
                <span className={AMOUNT}>{formatMoney(row.totalValue, currency)}</span>
              </span>
            </li>
          ))}
        </ul>
      </>
    )}
  </ReportPanel>
);
