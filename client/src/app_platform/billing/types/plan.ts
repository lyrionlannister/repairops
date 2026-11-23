export interface PlanSummary {
  // null = onboarding: el owner todavía no elige plan.
  plan: { key: PlanKey; name: string; maxUsers: number | null; maxBranches: number | null } | null;
  status: SubscriptionStatus;
  extraUsers: number;
  extraBranches: number;
  limits: { users: number | null; branches: number | null } | null;
  usage: { users: number; branches: number };
}

export type PlanKey = "basico" | "crecimiento" | "cadena" | "platform";

export type SubscriptionStatus = "incomplete" | "trialing" | "active" | "past_due" | "canceled";
