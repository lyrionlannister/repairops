import { Entity, Column, CreateDateColumn, Index, Unique, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";

export type SaleOrigin = "counter" | "repair_note" | "quote";

@Entity("sales")
@Index("IDX_sales_tenant_created", ["tenantId", "createdAt"])
@Unique(["tenantId", "saleNumber"])
@Unique(["tenantId", "idempotencyKey"])
export class Sale extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_sales_tenant" })
  tenant?: Tenant;

  @Column({ type: "bigint", nullable: false, name: "local_id" })
  localId!: string;

  @Column({ type: "int", name: "numero_venta" })
  saleNumber!: number;

  @Column({ type: "bigint", nullable: true, name: "customer_id" })
  customerId!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true, name: "nombre_cliente" })
  customerName!: string | null;

  // Caja obligatoria para cobrar (cap. 3 del plan: "sin sesión de caja no
  // hay cobro") -- SaleService.create lo exige antes de crear la venta.
  @Column({ type: "bigint", nullable: false, name: "id_sesion_caja" })
  cashSessionId!: string;

  @Column({ type: "varchar", length: 20, default: "counter", name: "origen" })
  origin!: SaleOrigin;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "subtotal" })
  subtotal!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0, name: "monto_descuento" })
  discountAmount!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0, name: "monto_impuesto" })
  taxAmount!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "valor_total" })
  totalValue!: number;

  @Column({ type: "bigint", nullable: true, name: "id_empleado_creador" })
  createdByEmployeeId!: string | null;

  // Un doble clic en "Cobrar" manda la misma clave dos veces -- la segunda
  // llamada encuentra esta fila por UNIQUE y devuelve la venta existente en
  // vez de crear una segunda (ver SaleService.create). Unico POR TENANT
  // (@Unique(["tenantId","idempotencyKey"]) arriba), no global -- un
  // UNIQUE sin scope de tenant es el ítem 8 del checklist db-schema-design.
  @Column({ type: "varchar", length: 100, nullable: true, name: "idempotency_key" })
  idempotencyKey!: string | null;

  @CreateDateColumn({ name: "fecha_creacion", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
