import { Check, Column, CreateDateColumn, Entity } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";

export type StripePriceKey =
  | "plan_basico_monthly"
  | "plan_basico_yearly"
  | "plan_crecimiento_monthly"
  | "plan_crecimiento_yearly"
  | "plan_cadena_monthly"
  | "plan_cadena_yearly"
  | "extra_user_monthly"
  | "extra_branch_monthly"
  | "whatsapp_pack_500"
  | "whatsapp_pack_1000"
  | "whatsapp_pack_2500";

export type StripePriceBillingInterval = "month" | "year" | "one_time";

// Catálogo de Price de Stripe, sin tenant_id -- igual patrón que `plans`. El
// código nunca hardcodea un `price_...`, siempre resuelve por `key` contra
// esta tabla (sembrada por la migración CreateStripePrices).
@Entity("stripe_prices")
@Check("CHK_stripe_prices_billing_interval", `"billing_interval" IN ('month', 'year', 'one_time')`)
@Check("CHK_stripe_prices_messages_granted", `"messages_granted" IS NULL OR "messages_granted" > 0`)
export class StripePrice extends BaseEntity {
  @Column({ type: "varchar", length: 60, unique: true, name: "key" })
  key!: StripePriceKey;

  @Column({ type: "varchar", length: 255, name: "stripe_price_id" })
  stripePriceId!: string;

  @Column({ type: "varchar", length: 255, name: "stripe_product_id" })
  stripeProductId!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "amount" })
  amount!: string;

  @Column({ type: "varchar", length: 3, default: "MXN", name: "currency" })
  currency!: string;

  @Column({ type: "varchar", length: 10, name: "billing_interval" })
  billingInterval!: StripePriceBillingInterval;

  // Solo filas whatsapp_pack_*.
  @Column({ type: "integer", nullable: true, name: "messages_granted" })
  messagesGranted!: number | null;

  @CreateDateColumn({ name: "fecha_creacion", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
