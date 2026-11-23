import { Check, Column, CreateDateColumn, Entity, UpdateDateColumn } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";

export type WhatsappMetaPricingCategory = "marketing" | "utility" | "authentication" | "service";

// Catálogo de costo por categoría de conversación de Meta, sin tenant_id --
// igual patrón que StripePrice. El código nunca hardcodea el monto, siempre
// resuelve por `category` contra esta tabla (sembrada por la migración
// CreateWhatsappMetaPricing, actualizable a mano si Meta cambia su tarifa).
@Entity("whatsapp_meta_pricing")
@Check(
  "CHK_whatsapp_meta_pricing_category",
  `"category" IN ('marketing', 'utility', 'authentication', 'service')`,
)
export class WhatsappMetaPricing extends BaseEntity {
  @Column({ type: "varchar", length: 30, unique: true, name: "category" })
  category!: WhatsappMetaPricingCategory;

  @Column({ type: "decimal", precision: 10, scale: 4, name: "cost_usd" })
  costUsd!: string;

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
