import type { PlanKey } from "../entities/plan.entity.js";
import type { StripePriceKey } from "../entities/stripe-price.entity.js";

type PublicPlanKey = Exclude<PlanKey, "platform">;

// Convención fija de `key` en stripe_prices -- un solo lugar que la conoce,
// nunca un Price de Stripe hardcodeado en otro archivo.
export function planPriceKey(
  planKey: PublicPlanKey,
  billingInterval: "month" | "year",
): StripePriceKey {
  return `plan_${planKey}_${billingInterval === "month" ? "monthly" : "yearly"}` as StripePriceKey;
}

export const EXTRA_USER_PRICE_KEY: StripePriceKey = "extra_user_monthly";
export const EXTRA_BRANCH_PRICE_KEY: StripePriceKey = "extra_branch_monthly";

export function whatsappPackPriceKey(size: 500 | 1000 | 2500): StripePriceKey {
  return `whatsapp_pack_${size}` as StripePriceKey;
}
