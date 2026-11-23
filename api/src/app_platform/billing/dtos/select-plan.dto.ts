import { IsIn } from "class-validator";

const PUBLIC_PLAN_KEYS = ["basico", "crecimiento", "cadena"] as const;
const BILLING_INTERVALS = ["month", "year"] as const;

export class SelectPlanDto {
  @IsIn(PUBLIC_PLAN_KEYS, { message: "Plan inválido" })
  planKey!: (typeof PUBLIC_PLAN_KEYS)[number];

  @IsIn(BILLING_INTERVALS, { message: "Ciclo de facturación inválido" })
  billingInterval!: (typeof BILLING_INTERVALS)[number];
}
