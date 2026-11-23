import { Column, CreateDateColumn, Entity } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";

// Sin tenant_id: el evento puede llegar antes de poder resolver a qué tenant
// corresponde. Solo existe para no reprocesar un evento que Stripe reintentó
// (insert-first: si el INSERT choca contra el UNIQUE, ya se procesó).
@Entity("stripe_webhook_events")
export class StripeWebhookEvent extends BaseEntity {
  @Column({ type: "varchar", length: 255, unique: true, name: "stripe_event_id" })
  stripeEventId!: string;

  @Column({ type: "varchar", length: 100, name: "type" })
  type!: string;

  @CreateDateColumn({ name: "fecha_creacion", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
