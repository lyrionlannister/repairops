import { Entity, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";

export type NotificationType = "conversation_transferred" | "new_human_message";

@Entity("notifications")
@Index("IDX_notifications_tenant", ["tenantId"])
export class Notification extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_notifications_tenant" })
  tenant?: Tenant;

  @Column({ type: "varchar", length: 50, name: "tipo" })
  type!: NotificationType;

  @Column({ type: "varchar", length: 100, name: "session_id" })
  sessionId!: string;

  @Column({ type: "varchar", length: 100, name: "telefono" })
  phone!: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "nombre_contacto" })
  contactName?: string;

  @Column({ type: "boolean", default: false, name: "leida" })
  read!: boolean;

  @CreateDateColumn({
    name: "fecha_creacion",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;
}
