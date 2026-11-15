import {
  Column,
  CreateDateColumn,
  Entity,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";

export type WhatsappOutboundMessageStatus = "sent" | "failed" | "blocked_not_approved" | "blocked_catalog_missing";

// Una fila por intento de envío de una plantilla proactiva (Checkpoint 3 del
// plan Fase 4). `idempotencyKey` es propia de este módulo -- nunca la de
// `Sale` (ver SPEC-pos-sale-cycle.md) -- así una misma causa (ej. la misma
// nota pasando a "terminada") nunca manda el mensaje dos veces.
@Entity("whatsapp_outbound_messages")
@Unique(["tenantId", "idempotencyKey"])
export class WhatsappOutboundMessage extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @Column({ type: "bigint", nullable: false, name: "account_id" })
  accountId!: string;

  // Snapshot del `key` al momento del intento, no FK -- es un log de lo que
  // se intentó enviar; borrar la entrada del catálogo despues no debe borrar
  // ni invalidar este historial (ver plan Fase 4, Checkpoint 7).
  @Column({ type: "varchar", length: 100, nullable: false, name: "catalog_key" })
  catalogKey!: string;

  @Column({ type: "varchar", length: 50, nullable: false, name: "destinatario" })
  to!: string;

  @Column({ type: "jsonb", default: () => `'{}'`, name: "variables" })
  variables!: Record<string, string>;

  @Column({ type: "varchar", length: 100, nullable: false, name: "idempotency_key" })
  idempotencyKey!: string;

  @Column({ type: "varchar", length: 30, nullable: false, name: "status" })
  status!: WhatsappOutboundMessageStatus;

  @Column({ type: "varchar", length: 50, nullable: true, name: "meta_message_id" })
  metaMessageId!: string | null;

  @Column({ type: "text", nullable: true, name: "error_message" })
  errorMessage!: string | null;

  @CreateDateColumn({
    name: "fecha_creacion",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "fecha_actualizacion",
    default: null,
    onUpdate: "CURRENT_TIMESTAMP",
    nullable: true,
  })
  updatedAt!: Date;
}
