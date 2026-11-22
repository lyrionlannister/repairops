import { IsIn, IsInt, IsOptional, Min } from "class-validator";
import type { PlanKey } from "../entities/plan.entity.js";
import { SUBSCRIPTION_STATUSES, type SubscriptionStatus } from "../entities/subscription.entity.js";

const PLAN_KEYS: PlanKey[] = ["basico", "crecimiento", "cadena", "platform"];

export class AssignSubscriptionDto {
  @IsIn(PLAN_KEYS, { message: "Plan inválido" })
  planKey!: PlanKey;

  @IsOptional()
  @IsInt({ message: "extraUsers debe ser entero" })
  @Min(0, { message: "extraUsers no puede ser negativo" })
  extraUsers?: number;

  @IsOptional()
  @IsInt({ message: "extraBranches debe ser entero" })
  @Min(0, { message: "extraBranches no puede ser negativo" })
  extraBranches?: number;

  @IsOptional()
  @IsIn(SUBSCRIPTION_STATUSES, { message: "Estado inválido" })
  status?: SubscriptionStatus;
}
