import { useCallback, useEffect, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import type { BillingInterval, PlanOption, SelectPlanResponse } from "../types/onboarding-plan";

export const useOnboardingPlans = () => {
  const { apiClient } = useApiClient();
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [loading, setLoading] = useState(true);
  const [selectingKey, setSelectingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const response = await apiClient("/billing/public-plans");
      if (!active) return;
      if (response.ok) setPlans(await response.json());
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [apiClient]);

  const toggleInterval = useCallback(() => {
    setInterval((prev) => (prev === "month" ? "year" : "month"));
  }, []);

  const selectPlan = useCallback(
    async (planKey: PlanOption["key"]) => {
      setSelectingKey(planKey);
      setError(null);
      const response = await apiClient("/billing/select-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, billingInterval: interval }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? "No se pudo iniciar el pago");
        setSelectingKey(null);
        return;
      }
      const { checkoutUrl }: SelectPlanResponse = await response.json();
      window.location.href = checkoutUrl;
    },
    [apiClient, interval],
  );

  return { plans, interval, toggleInterval, loading, selectingKey, error, selectPlan };
};
