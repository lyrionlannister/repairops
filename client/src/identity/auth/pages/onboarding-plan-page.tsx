import { Smartphone } from "lucide-react";
import { Toggle } from "@ui/toggle/toggle";
import { Loader } from "@ui/loader/loader";
import { PageMeta } from "../../../core/common/pages/page-meta";
import { useOnboardingPlans } from "../hooks/use-onboarding-plans";
import { PlanCard } from "../components/plan-card";

export const OnboardingPlanPage: React.FC = () => {
  const { plans, interval, toggleInterval, loading, selectingKey, error, selectPlan } =
    useOnboardingPlans();

  return (
    <>
      <PageMeta title="Elige tu plan" description="Elige el plan de RepairOps para tu taller" />
      <div className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-950 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col items-center gap-2 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <Smartphone className="size-6" />
            </span>
            <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
              Elige el plan de tu taller
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              14 días de prueba, cancela cuando quieras. Se te pedirá tu tarjeta, pero no se cobra
              nada hasta que termine el periodo de prueba.
            </p>
          </div>

          <div className="mb-8 flex items-center justify-center gap-3">
            <span
              className={`text-sm ${interval === "month" ? "font-semibold text-gray-800 dark:text-white/90" : "text-gray-500 dark:text-gray-400"}`}
            >
              Mensual
            </span>
            <Toggle checked={interval === "year"} onChange={toggleInterval} />
            <span
              className={`text-sm ${interval === "year" ? "font-semibold text-gray-800 dark:text-white/90" : "text-gray-500 dark:text-gray-400"}`}
            >
              Anual (2 meses gratis)
            </span>
          </div>

          {error && <p className="mb-4 text-center text-sm text-error-500">{error}</p>}

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader />
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.key}
                  plan={plan}
                  interval={interval}
                  highlighted={plan.key === "crecimiento"}
                  loading={selectingKey === plan.key}
                  onSelect={() => selectPlan(plan.key)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
