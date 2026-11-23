import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import type { PlanKey } from "./plan.entity.js";

// Ledger de cobros reales ya efectuados (invoice.payment_succeeded) -- alimenta
// el dashboard de platform-admin sin pegarle a la API de Stripe en cada carga.
// plan_key es snapshot (no FK): el plan del tenant puede haber cambiado después.
@Entity("stripe_invoice_payments")
export class StripeInvoicePayment extends BaseEntity {
  @Index("IDX_stripe_invoice_payments_tenant")
  @Column({ type: "bigint", name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_stripe_invoice_payments_tenant" })
  tenant?: Tenant;

  @Column({ type: "varchar", length: 255, unique: true, name: "stripe_invoice_id" })
  stripeInvoiceId!: string;

  @Column({ type: "varchar", length: 30, name: "plan_key" })
  planKey!: PlanKey;

  @Column({ type: "varchar", length: 10, name: "billing_interval" })
  billingInterval!: "month" | "year";

  @Column({ type: "decimal", precision: 10, scale: 2, name: "amount" })
  amount!: string;

  @Column({ type: "varchar", length: 3, default: "MXN", name: "currency" })
  currency!: string;

  @Column({ type: "timestamp", name: "paid_at" })
  paidAt!: Date;

  @CreateDateColumn({ name: "fecha_creacion", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
