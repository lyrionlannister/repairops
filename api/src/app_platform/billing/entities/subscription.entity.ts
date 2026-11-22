import { Check, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, UpdateDateColumn } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { Plan } from "./plan.entity.js";

export const SUBSCRIPTION_STATUSES = ["trialing", "active", "past_due", "canceled"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

@Entity("subscriptions")
@Check("CHK_subscriptions_extras", `"extra_users" >= 0 AND "extra_branches" >= 0`)
export class Subscription extends BaseEntity {
  @Column({ type: "bigint", unique: true, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_subscriptions_tenant" })
  tenant?: Tenant;

  @Column({ type: "bigint", name: "plan_id" })
  planId!: string;

  // Sin CASCADE: un plan en uso no se puede borrar.
  @ManyToOne(() => Plan)
  @JoinColumn({ name: "plan_id", foreignKeyConstraintName: "FK_subscriptions_plan" })
  plan?: Plan;

  @Column({ type: "enum", enum: SUBSCRIPTION_STATUSES, enumName: "subscription_status", default: "trialing", name: "status" })
  status!: SubscriptionStatus;

  @Column({ type: "integer", default: 0, name: "extra_users" })
  extraUsers!: number;

  @Column({ type: "integer", default: 0, name: "extra_branches" })
  extraBranches!: number;

  @CreateDateColumn({ name: "fecha_creacion", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "fecha_actualizacion", default: null, onUpdate: "CURRENT_TIMESTAMP", nullable: true })
  updatedAt!: Date;
}
