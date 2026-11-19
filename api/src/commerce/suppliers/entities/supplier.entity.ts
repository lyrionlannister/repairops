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

@Entity("proveedores")
@Index("IDX_proveedores_tenant", ["tenantId"])
export class Supplier extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_proveedores_tenant" })
  tenant?: Tenant;

  @Column({ type: "varchar", length: 255, nullable: false, name: "nombre" })
  name!: string;

  @Column({ type: "varchar", length: 20, nullable: false, name: "telefono" })
  phone!: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "email" })
  email?: string | null;

  @Column({ type: "varchar", length: 500, nullable: true, name: "direccion" })
  address?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true, name: "nombre_contacto" })
  contactName?: string | null;

  @Column({ type: "boolean", default: true, name: "activo" })
  isActive!: boolean;

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
