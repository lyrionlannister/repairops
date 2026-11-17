import { CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";

@Entity("excluded_phone")
export class ExcludedPhone {
  // PK compuesta: dos tenants pueden excluir el mismo numero de forma
  // independiente.
  @PrimaryColumn({ type: "bigint", name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_excluded_phone_tenant" })
  tenant?: Tenant;

  @PrimaryColumn({ type: "varchar", length: 64, name: "telefono" })
  phone!: string;

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
