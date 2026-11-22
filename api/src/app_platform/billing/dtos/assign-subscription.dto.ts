import { IsIn, IsInt, IsOptional, Min } from "class-validator";
import type { PlanKey } from "../entities/plan.entity.js";
import { SUBSCRIPTION_STATUSES, type SubscriptionStatus } from "../entities/subscription.entity.js";

const PLAN_KEYS: PlanKey[] = ["basico", "crecimiento", "cadena", "platform"];

export class AssignSubscriptionDto {
  @IsIn(PLAN_KEYS, { message: "Plan inválido" })
  planKey!: PlanKey;

  @IsOptional()
  @IsInt({ message: "Usuarios extra deben ser un número entero" })
  @Min(0, { message: "Usuarios extra no pueden ser negativos" })
  extraUsers?: number;

  @IsOptional()
  @IsInt({ message: "Sucursales extra deben ser un número entero" })
  @Min(0, { message: "Sucursales extra no pueden ser negativas" })
  extraBranches?: number;

  @IsOptional()
  @IsIn(SUBSCRIPTION_STATUSES, { message: "Estado inválido" })
  status?: SubscriptionStatus;
}
