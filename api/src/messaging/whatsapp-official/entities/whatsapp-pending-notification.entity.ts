import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { RepairNote } from "../../../commerce/repair-notes/entities/repair-note.entity.js";

// Aviso de WhatsApp pendiente de una nota: existe mientras la ventana de 24h
// del contacto esta cerrada en el momento del evento (nunca se manda una
// plantilla HSM de pago para avisar fuera de ventana). Una sola fila por
// nota -- el evento mas reciente pisa al anterior, para que el cliente nunca
// reciba un aviso viejo (ej. "listo para recoger" despues de cancelada).
@Entity("whatsapp_pending_notifications")
@Unique("UQ_whatsapp_pending_notifications_nota", ["tenantId", "repairNoteId"])
export class WhatsappPendingNotification extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "tenant_id",
    foreignKeyConstraintName: "FK_whatsapp_pending_notifications_tenant",
  })
  tenant?: Tenant;

  @Column({ type: "bigint", nullable: false, name: "repair_note_id" })
  repairNoteId!: string;

  @ManyToOne(() => RepairNote, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "repair_note_id",
    foreignKeyConstraintName: "FK_whatsapp_pending_notifications_repair_note",
  })
  repairNote?: RepairNote;

  // Solo informativo (numero_contacto de la nota al momento de encolar): el
  // flush no filtra por esta columna, se busca por repairNoteId -- el cliente
  // puede escribir desde otro telefono (el suyo esta en reparacion).
  @Column({ type: "varchar", length: 32, nullable: false, name: "contact_number" })
  contactNumber!: string;

  // Mismo vocabulario que whatsapp_template_catalog_entries.trigger_event
  // (ej. "repair_note.status_changed_to_terminada") -- varchar a proposito,
  // no enum: ambas tablas describen el mismo concepto de evento y deben
  // poder crecer juntas sin dos mecanismos distintos de validacion.
  @Column({ type: "varchar", length: 100, nullable: false, name: "event_key" })
  eventKey!: string;

  // Texto final ya armado (nombre, numero de control) -- se manda como texto
  // libre dentro de la ventana, nunca como plantilla HSM.
  @Column({ type: "text", nullable: false, name: "message_text" })
  messageText!: string;

  @Column({ type: "timestamptz", nullable: false, name: "expires_at" })
  expiresAt!: Date;

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
