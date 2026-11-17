import { Entity, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";

export type UserRole = "owner" | "admin" | "employee" | "technician" | "cashier";
export type PayCycle = "weekly" | "biweekly" | "monthly";

@Entity("usuarios")
@Index("IDX_usuarios_tenant", ["tenantId"])
export class User extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_usuarios_tenant" })
  tenant?: Tenant;

  @Column({ type: "varchar", length: 20, default: "owner", name: "rol" })
  role!: UserRole;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true, name: "salario" })
  salaryAmount!: number | null;

  @Column({ type: "varchar", length: 20, nullable: true, name: "ciclo_pago" })
  payCycle!: PayCycle | null;

  @Column({ type: "varchar", length: 100, nullable: false, name: "nombre" })
  firstName!: string;

  @Column({ type: "varchar", length: 100, nullable: false, name: "apellido" })
  lastName!: string;

  @Column({ type: "varchar", length: 255, nullable: false, name: "email" })
  email!: string;

  @Column({ type: "varchar", length: 255, nullable: false, name: "contrasena" })
  password!: string;

  @Column({ type: "boolean", default: true, name: "activo" })
  isActive!: boolean;

  // Ortogonal a `role`: un owner/admin de cualquier tenant puede ademas ser
  // platform admin. Administra configuracion de la plataforma misma (ej.
  // catalogo de plantillas "de sistema", ver plan Fase 4 Checkpoint 7), no
  // datos de ningun tenant -- por eso no es un UserRole mas. Sin flujo propio
  // de alta todavia (se otorga a mano en DB, decision consciente).
  @Column({ type: "boolean", default: false, name: "es_platform_admin" })
  isPlatformAdmin!: boolean;

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
