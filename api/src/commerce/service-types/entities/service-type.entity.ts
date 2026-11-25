import { Entity, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";

// Tipos de servicio: configurables por tenant (se siembran defaults al
// crear el tenant, el tenant puede agregar los suyos). Reemplaza los
// booleans fijos que tenia repair_notes (serviceRepair/.../serviceWaterDamage).
@Entity("service_types")
@Index("IDX_service_types_tenant", ["tenantId"])
export class ServiceType extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_service_types_tenant" })
  tenant?: Tenant;

  @Column({ type: "varchar", length: 100, nullable: false, name: "nombre" })
  name!: string;

  // Precio base del servicio, configurable por tenant. Null = sin precio
  // configurado: el precio lo fija un humano en cada venta y queda en
  // bitácora (ver SaleService). Nunca se confía en el precio que manda el
  // cliente cuando hay un base_price configurado.
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true, name: "precio_base" })
  basePrice!: string | null;

  @CreateDateColumn({ name: "fecha_creacion", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
