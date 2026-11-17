import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";

export type ChatDirection = "inbound" | "outbound";
export type ChatSender = "customer" | "ai" | "agent";

// Historial de chat propio del API (reemplaza al historial que
// escribia n8n, sin tenant). Solo guarda las ultimas 24h (ver
// ChatRetentionService): las estadisticas viven en chat_daily_stats /
// chat_daily_contacts, que sobreviven al purgado.
@Entity("chat_messages")
@Index("IDX_chat_messages_tenant_contact", ["tenantId", "contactPhone", "id"])
@Index("IDX_chat_messages_tenant_created", ["tenantId", "createdAt"])
@Index("UQ_chat_messages_tenant_wa_message", ["tenantId", "waMessageId"], {
  unique: true,
  where: '"wa_message_id" IS NOT NULL',
})
@Check("CHK_chat_messages_direction", `"direction" IN ('inbound', 'outbound')`)
@Check("CHK_chat_messages_sender", `"sender" IN ('customer', 'ai', 'agent')`)
@Check(
  "CHK_chat_messages_direction_sender",
  `("direction" = 'inbound' AND "sender" = 'customer') OR ("direction" = 'outbound' AND "sender" IN ('ai', 'agent'))`,
)
export class ChatMessage extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_chat_messages_tenant" })
  tenant?: Tenant;

  // Solo digitos, normalizado al guardar (ver normalizePhone).
  @Column({ type: "varchar", length: 32, name: "contact_phone" })
  contactPhone!: string;

  @Column({ type: "varchar", length: 10 })
  direction!: ChatDirection;

  @Column({ type: "varchar", length: 10 })
  sender!: ChatSender;

  @Column({ type: "text" })
  body!: string;

  // Id del mensaje en Meta (wamid): Meta reentrega webhooks y no debe
  // duplicar filas.
  @Column({ type: "varchar", length: 128, nullable: true, name: "wa_message_id" })
  waMessageId!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
