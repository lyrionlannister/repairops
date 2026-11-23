import type { FC } from "react";
import { Banknote, Building2, UserX } from "lucide-react";
import { formatRelativeTime } from "@/home/utils/format";
import { formatMoney } from "../utils/format";
import type { ActivityItem } from "../types/billing-overview";
import type { BillingActivityFeedProps } from "../props/billing-activity-feed-props";

const ICON_TONE: Record<ActivityItem["kind"], string> = {
  signup: "bg-brand-100 dark:bg-brand-500/10",
  payment: "bg-success-100 dark:bg-success-500/10",
  cancellation: "bg-error-100 dark:bg-error-500/10",
};

const icon = (kind: ActivityItem["kind"]) => {
  switch (kind) {
    case "signup":
      return <Building2 className="size-4 text-brand-600 dark:text-brand-400" />;
    case "payment":
      return <Banknote className="size-4 text-success-600 dark:text-success-400" />;
    case "cancellation":
      return <UserX className="size-4 text-error-600 dark:text-error-400" />;
  }
};

const subtitle = (item: ActivityItem): string => {
  switch (item.kind) {
    case "signup":
      return "Nuevo taller registrado";
    case "payment":
      return "Pago recibido";
    case "cancellation":
      return "Canceló su suscripción";
  }
};

export const BillingActivityFeed: FC<BillingActivityFeedProps> = ({ activity }) => (
  <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Actividad reciente</h3>
    {activity.length === 0 ? (
      <div className="mt-4 flex min-h-48 flex-1 items-center justify-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">Sin actividad en este periodo.</p>
      </div>
    ) : (
      <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
        {activity.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ICON_TONE[item.kind]}`}
              >
                {icon(item.kind)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {item.tenantName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle(item)}</p>
              </div>
            </div>
            <div className="text-right">
              {item.amount !== undefined && (
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {formatMoney(item.amount)}
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {formatRelativeTime(item.occurredAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
