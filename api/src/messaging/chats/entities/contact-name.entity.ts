import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";

@Entity("contact_names")
export class ContactName {
  // PK compuesta: dos tenants pueden tener el mismo telefono con nombres
  // distintos.
  @PrimaryColumn({ type: "bigint", name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_contact_names_tenant" })
  tenant?: Tenant;

  @PrimaryColumn({ type: "varchar", length: 50, name: "telefono" })
  phone!: string;

  @Column({ type: "varchar", length: 255, nullable: false, name: "nombre" })
  name!: string;

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
