import type { FC } from "react";
import { Check } from "lucide-react";
import { Button } from "@ui/button/button";
import { formatCurrency, limitLabel } from "../utils/format";
import type { PlanCardProps } from "../props/plan-card-props";

export const PlanCard: FC<PlanCardProps> = ({ plan, interval, highlighted, loading, onSelect }) => {
  const price = interval === "month" ? plan.monthlyPrice : plan.yearlyPrice;

  return (
    <div
      className={`relative flex flex-col gap-5 rounded-2xl border p-6 ${
        highlighted
          ? "border-brand-500 bg-brand-50/50 ring-1 ring-brand-500 dark:border-brand-500 dark:bg-brand-500/5"
          : "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3"
      }`}
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">
          Recomendado
        </span>
      )}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{plan.name}</h3>
        <p className="mt-2">
          <span className="text-3xl font-bold text-gray-800 dark:text-white/90">
            {price ? formatCurrency(price) : "—"}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {" "}
            / {interval === "month" ? "mes" : "año"}
          </span>
        </p>
      </div>

      <ul className="flex flex-1 flex-col gap-2 text-sm text-gray-600 dark:text-gray-300">
        <li className="flex items-center gap-2">
          <Check className="size-4 shrink-0 text-brand-500" />
          {limitLabel(plan.maxUsers, "usuario", "usuarios")}
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-4 shrink-0 text-brand-500" />
          {limitLabel(plan.maxBranches, "sucursal", "sucursales")}
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-4 shrink-0 text-brand-500" />
          Notas ilimitadas
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-4 shrink-0 text-brand-500" />
          {plan.whatsappMonthlyQuota === null
            ? "WhatsApp sin límite"
            : `${plan.whatsappMonthlyQuota} mensajes de WhatsApp/mes`}
        </li>
      </ul>

      <Button variant="primary" className="w-full" disabled={loading} onClick={onSelect}>
        {loading ? "Redirigiendo..." : "Elegir plan"}
      </Button>
    </div>
  );
};
