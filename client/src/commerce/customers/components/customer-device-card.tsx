import type { FC } from "react";
import { Link } from "react-router";
import { ChevronRight, Smartphone } from "lucide-react";
import { formatDay, formatMoney } from "../utils/format";
import type { CustomerDeviceCardProps } from "../props/customer-device-card-props";

export const CustomerDeviceCard: FC<CustomerDeviceCardProps> = ({ device }) => (
  <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
    <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
        <Smartphone className="size-5" />
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold text-gray-800 dark:text-white/90">
          {device.brand} {device.model}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {device.notesCount} {device.notesCount === 1 ? "visita" : "visitas"} · última el{" "}
          {formatDay(device.lastReceivedAt)}
        </p>
      </div>
    </div>

    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
      {device.visits.map((visit, index) => (
        <li key={`${visit.repairNoteId}-${index}`} className="flex flex-col gap-2 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Nota #{visit.controlNumber}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${visit.statusClassName}`}
              >
                {visit.statusLabel}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDay(visit.receivedAt)}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              <span className="text-xs font-normal text-gray-400 dark:text-gray-500">Total nota </span>
              {formatMoney(Number(visit.totalValue))}
            </span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300">
            {visit.reportedFailure}
            {visit.deviceOff && (
              <span className="ml-1 text-xs font-medium text-orange-600 dark:text-orange-400">
                (apagado)
              </span>
            )}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {visit.serviceTypeNames.map((name) => (
                <span
                  key={name}
                  className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                >
                  {name}
                </span>
              ))}
            </div>
            <Link
              to={`/commerce/repair-notes/${visit.repairNoteId}`}
              className="inline-flex min-h-11 items-center gap-0.5 rounded-lg px-2 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
            >
              Ver nota
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </li>
      ))}
    </ul>
  </div>
);
