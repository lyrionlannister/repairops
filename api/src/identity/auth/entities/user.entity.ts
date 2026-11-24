import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";

export const USER_ROLES = ["owner", "cashier", "technician", "employee"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export type PayCycle = "weekly" | "biweekly" | "monthly";

@Entity("usuarios")
@Index("IDX_usuarios_tenant", ["tenantId"])
export class User extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_usuarios_tenant" })
  tenant?: Tenant;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true, name: "salario" })
  salaryAmount!: string | null;

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

  // null = correo sin verificar. Lo crea registerPlatformAdmin/createTenantByAdmin
  // ya verificado (un admin humano vouches por ese alta); el registro público
  // (AuthService.register) lo deja null hasta que el owner confirma el enlace
  // que manda AuthService.issueEmailVerification -- ver tenant.middleware.ts,
  // que bloquea el resto de la app mientras siga null.
  @Column({ type: "timestamp", nullable: true, name: "email_verificado_en" })
  emailVerifiedAt!: Date | null;

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
