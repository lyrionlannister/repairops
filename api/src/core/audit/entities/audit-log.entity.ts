import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../common/entities/base.entity.js";
import { Tenant } from "../../tenancy/entities/tenant.entity.js";

// Bitácora de auditoría mínima: quién hizo qué, cuándo y sobre qué.
// `tenantId`/`userId` son nulos en eventos sin tenant resuelto todavía
// (p.ej. un login fallido con un correo que no existe). Solo se escribe,
// nunca se edita ni se borra desde la app; el platform-admin la leerá
// desde su panel.
@Entity("audit_logs")
@Index("IDX_audit_logs_tenant_created", ["tenantId", "createdAt"])
export class AuditLog extends BaseEntity {
  @Column({ type: "bigint", nullable: true, name: "tenant_id" })
  tenantId!: string | null;

  // Borrar un tenant borra su bitácora: es dato del cliente y no debe
  // sobrevivir a la baja. Los eventos sin tenant (tenantId nulo) no se tocan.
  @ManyToOne(() => Tenant, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_audit_logs_tenant" })
  tenant?: Tenant | null;

  @Column({ type: "bigint", nullable: true, name: "user_id" })
  userId!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true, name: "actor_email" })
  actorEmail!: string | null;

  @Column({ type: "varchar", length: 100, name: "action" })
  action!: string;

  @Column({ type: "varchar", length: 100, name: "entity" })
  entity!: string;

  @Column({ type: "varchar", length: 50, nullable: true, name: "entity_id" })
  entityId!: string | null;

  @Column({ type: "jsonb", nullable: true, name: "details" })
  details!: Record<string, unknown> | null;

  @CreateDateColumn({ name: "fecha_creacion", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
