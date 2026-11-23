import type { BillingInterval, PlanOption } from "../types/onboarding-plan";

export interface PlanCardProps {
  plan: PlanOption;
  interval: BillingInterval;
  highlighted: boolean;
  loading: boolean;
  onSelect: () => void;
}
