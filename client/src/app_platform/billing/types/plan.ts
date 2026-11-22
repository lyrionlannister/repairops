export interface PlanSummary {
  plan: { key: PlanKey; name: string; maxUsers: number | null; maxBranches: number | null };
  status: SubscriptionStatus;
  extraUsers: number;
  extraBranches: number;
  limits: { users: number | null; branches: number | null };
  usage: { users: number; branches: number };
}

export type PlanKey = "basico" | "crecimiento" | "cadena" | "platform";

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";
