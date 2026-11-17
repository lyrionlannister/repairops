import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { RepairNote } from "../../../commerce/repair-notes/entities/repair-note.entity.js";

export type ChatDirection = "inbound" | "outbound";
export type ChatSender = "customer" | "ai" | "agent";
export type ChatMessageType = "text" | "image" | "audio" | "video" | "document" | "sticker" | "location";

// Historial de chat propio del API (reemplaza al historial que
// escribia n8n, sin tenant). Solo guarda las ultimas 24h (ver
// ChatRetentionService): las estadisticas viven en chat_daily_stats /
// chat_daily_contacts, que sobreviven al purgado.
@Entity("chat_messages")
@Index("IDX_chat_messages_tenant_contact", ["tenantId", "contactPhone", "id"])
@Index("IDX_chat_messages_tenant_created", ["tenantId", "createdAt"])
@Index("IDX_chat_messages_repair_note", ["repairNoteId"])
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
@Check(
  "CHK_chat_messages_type",
  `"message_type" IN ('text', 'image', 'audio', 'video', 'document', 'sticker', 'location')`,
)
@Check(
  "CHK_chat_messages_text_plain",
  `"message_type" <> 'text' OR ("media_key" IS NULL AND "media_mime" IS NULL AND "media_size" IS NULL AND "location_lat" IS NULL AND "location_lng" IS NULL)`,
)
@Check(
  "CHK_chat_messages_location",
  `"message_type" <> 'location' OR ("location_lat" IS NOT NULL AND "location_lng" IS NOT NULL)`,
)
@Check("CHK_chat_messages_media_complete", `"media_key" IS NULL OR ("media_mime" IS NOT NULL AND "media_size" IS NOT NULL)`)
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

  @Column({ type: "varchar", length: 12, default: "text", name: "message_type" })
  messageType!: ChatMessageType;

  // Clave del archivo en el almacen (ver MediaStorage); null si no es archivo o no se pudo guardar.
  @Column({ type: "varchar", length: 255, nullable: true, name: "media_key" })
  mediaKey!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true, name: "media_mime" })
  mediaMime!: string | null;

  @Column({ type: "integer", nullable: true, name: "media_size" })
  mediaSize!: number | null;

  @Column({ type: "numeric", precision: 9, scale: 6, nullable: true, name: "location_lat" })
  locationLat!: string | null;

  @Column({ type: "numeric", precision: 9, scale: 6, nullable: true, name: "location_lng" })
  locationLng!: string | null;

  // Nota a la que apunta la conversacion (por el ref del QR). Si la nota se
  // borra, el mensaje se conserva sin liga.
  @Column({ type: "bigint", nullable: true, name: "repair_note_id" })
  repairNoteId!: string | null;

  @ManyToOne(() => RepairNote, { onDelete: "SET NULL" })
  @JoinColumn({ name: "repair_note_id", foreignKeyConstraintName: "FK_chat_messages_repair_note" })
  repairNote?: RepairNote;

  @CreateDateColumn({ name: "created_at", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
