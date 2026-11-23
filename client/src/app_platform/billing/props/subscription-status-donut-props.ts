import type { SubscriptionStatus } from "../types/plan";

export interface SubscriptionStatusDonutProps {
  subscriptionsByStatus: Partial<Record<SubscriptionStatus, number>>;
}
