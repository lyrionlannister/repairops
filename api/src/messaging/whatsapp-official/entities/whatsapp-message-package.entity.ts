import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import type { StripePriceKey } from "../../../app_platform/billing/entities/stripe-price.entity.js";

// Ledger de paquetes extra de WhatsApp comprados (compra one-time vía
// Stripe Checkout) -- nunca un contador mutable, mismo criterio que
// CashMovement. Solo cuentan para la cuota del mes en que se compraron
// (WhatsappQuotaService filtra por createdAt dentro del periodo vigente).
@Entity("whatsapp_message_packages")
@Check("CHK_whatsapp_message_packages_messages", `"messages_granted" > 0`)
export class WhatsappMessagePackage extends BaseEntity {
  @Index("IDX_whatsapp_message_packages_tenant")
  @Column({ type: "bigint", name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "tenant_id",
    foreignKeyConstraintName: "FK_whatsapp_message_packages_tenant",
  })
  tenant?: Tenant;

  @Column({ type: "varchar", length: 255, unique: true, name: "stripe_checkout_session_id" })
  stripeCheckoutSessionId!: string;

  @Column({ type: "varchar", length: 60, name: "stripe_price_key" })
  stripePriceKey!: StripePriceKey;

  @Column({ type: "integer", name: "messages_granted" })
  messagesGranted!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "amount_paid" })
  amountPaid!: string;

  @CreateDateColumn({ name: "fecha_creacion", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
