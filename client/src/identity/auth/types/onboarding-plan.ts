export type BillingInterval = "month" | "year";

export interface PlanOption {
  key: "basico" | "crecimiento" | "cadena";
  name: string;
  maxUsers: number | null;
  maxBranches: number | null;
  whatsappMonthlyQuota: number | null;
  monthlyPrice: string | null;
  yearlyPrice: string | null;
}

export interface SelectPlanResponse {
  checkoutUrl: string;
}
