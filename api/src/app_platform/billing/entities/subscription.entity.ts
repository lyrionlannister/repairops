import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { Plan } from "./plan.entity.js";

export const SUBSCRIPTION_STATUSES = [
  "incomplete",
  "trialing",
  "active",
  "past_due",
  "canceled",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

@Entity("subscriptions")
@Check("CHK_subscriptions_extras", `"extra_users" >= 0 AND "extra_branches" >= 0`)
@Check(
  "CHK_subscriptions_billing_interval",
  `"billing_interval" IS NULL OR "billing_interval" IN ('month', 'year')`,
)
export class Subscription extends BaseEntity {
  @Column({ type: "bigint", unique: true, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_subscriptions_tenant" })
  tenant?: Tenant;

  // null = onboarding: Customer de Stripe ya creado, plan todavía sin elegir.
  @Column({ type: "bigint", nullable: true, name: "plan_id" })
  planId!: string | null;

  // Sin CASCADE: un plan en uso no se puede borrar.
  @ManyToOne(() => Plan)
  @JoinColumn({ name: "plan_id", foreignKeyConstraintName: "FK_subscriptions_plan" })
  plan?: Plan | null;

  @Column({
    type: "enum",
    enum: SUBSCRIPTION_STATUSES,
    enumName: "subscription_status",
    default: "trialing",
    name: "status",
  })
  status!: SubscriptionStatus;

  @Column({ type: "integer", default: 0, name: "extra_users" })
  extraUsers!: number;

  @Column({ type: "integer", default: 0, name: "extra_branches" })
  extraBranches!: number;

  @Column({ type: "varchar", length: 255, nullable: true, name: "stripe_customer_id" })
  stripeCustomerId!: string | null;

  // Subscription de Stripe del plan base -- la de extras es otra (ver abajo),
  // siempre mensual aunque el plan sea anual (decisión del negocio).
  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
    unique: true,
    name: "stripe_subscription_id",
  })
  stripeSubscriptionId!: string | null;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
    unique: true,
    name: "stripe_extras_subscription_id",
  })
  stripeExtrasSubscriptionId!: string | null;

  // null = plan platform (sin Stripe). 'month' | 'year'.
  @Column({ type: "varchar", length: 10, nullable: true, name: "billing_interval" })
  billingInterval!: "month" | "year" | null;

  @Column({ type: "timestamp", nullable: true, name: "current_period_start" })
  currentPeriodStart!: Date | null;

  @Column({ type: "timestamp", nullable: true, name: "current_period_end" })
  currentPeriodEnd!: Date | null;

  @CreateDateColumn({ name: "fecha_creacion", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "fecha_actualizacion",
    default: null,
    onUpdate: "CURRENT_TIMESTAMP",
    nullable: true,
  })
  updatedAt!: Date;
}
