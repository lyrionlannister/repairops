import type { FC } from "react";
import { Check } from "lucide-react";
import { Button } from "@ui/button/button";
import { formatCurrency, limitLabel } from "../utils/format";
import type { PlanCardProps } from "../props/plan-card-props";

export const PlanCard: FC<PlanCardProps> = ({ plan, interval, highlighted, loading, onSelect }) => {
  const price = interval === "month" ? plan.monthlyPrice : plan.yearlyPrice;
  // Único "antes" real que se puede mostrar sin inventar un precio: 12 meses
  // al precio mensual, contra el anual ya con el descuento aplicado.
  const yearlyListPrice =
    interval === "year" && plan.monthlyPrice ? (Number(plan.monthlyPrice) * 12).toFixed(2) : null;

  const features = [
    limitLabel(plan.maxUsers, "usuario", "usuarios"),
    limitLabel(plan.maxBranches, "sucursal", "sucursales"),
    "Notas ilimitadas",
    plan.whatsappMonthlyQuota === null
      ? "WhatsApp sin límite"
      : `${plan.whatsappMonthlyQuota} mensajes de WhatsApp/mes`,
  ];

  return (
    <div
      className={`relative flex flex-col gap-5 rounded-2xl p-6 ${
        highlighted
          ? "bg-gray-900 text-white dark:bg-black"
          : "border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3"
      }`}
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">
          Recomendado
        </span>
      )}

      <h3
        className={`text-lg font-semibold ${highlighted ? "text-white" : "text-gray-800 dark:text-white/90"}`}
      >
        {plan.name}
      </h3>

      <div className="flex items-baseline gap-2">
        <span
          className={`text-3xl font-bold ${highlighted ? "text-white" : "text-gray-800 dark:text-white/90"}`}
        >
          {price ? formatCurrency(price) : "—"}
        </span>
        <span
          className={`text-sm ${highlighted ? "text-gray-300" : "text-gray-500 dark:text-gray-400"}`}
        >
          / {interval === "month" ? "mes" : "año"}
        </span>
        {yearlyListPrice && (
          <span
            className={`text-sm line-through ${highlighted ? "text-gray-400" : "text-gray-400 dark:text-gray-500"}`}
          >
            {formatCurrency(yearlyListPrice)}
          </span>
        )}
      </div>

      <hr className={highlighted ? "border-white/10" : "border-gray-200 dark:border-gray-800"} />

      <ul className="flex flex-1 flex-col gap-3 text-sm">
        {features.map((feature) => (
          <li
            key={feature}
            className={`flex items-center gap-2 ${highlighted ? "text-gray-200" : "text-gray-600 dark:text-gray-300"}`}
          >
            <Check
              className={`size-4 shrink-0 ${highlighted ? "text-brand-400" : "text-brand-500"}`}
            />
            {feature}
          </li>
        ))}
      </ul>

      {highlighted ? (
        <Button variant="primary" className="w-full" disabled={loading} onClick={onSelect}>
          {loading ? "Redirigiendo..." : `Elegir ${plan.name}`}
        </Button>
      ) : (
        // Botón oscuro invertido (claro en modo oscuro): el variant compartido
        // no cubre esta combinación, y mezclar su bg-gray-100 con un override
        // por className deja el color real a merced del orden de Tailwind en
        // el bundle -- más simple y confiable no pasar por Button acá.
        <button
          type="button"
          disabled={loading}
          onClick={onSelect}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {loading ? "Redirigiendo..." : `Elegir ${plan.name}`}
        </button>
      )}
    </div>
  );
};
