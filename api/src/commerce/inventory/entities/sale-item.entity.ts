import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { Sale } from "./sale.entity.js";

export type SaleItemLineType = "inventory_item" | "service_type";

@Entity("sale_items")
@Index("IDX_sale_items_tenant", ["tenantId"])
@Index("IDX_sale_items_id_venta", ["saleId"])
export class SaleItem extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_sale_items_tenant" })
  tenant?: Tenant;

  @Column({ type: "bigint", nullable: false, name: "id_venta" })
  saleId!: string;

  @ManyToOne(() => Sale, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_venta", foreignKeyConstraintName: "FK_sale_items_id_venta" })
  sale?: Sale;

  // Discriminador explicito -- mismo patron que InventoryMovement/CashMovement
  // (tipo_entidad_relacionada + id_entidad_relacionada), no un par de columnas
  // nullable sin nombre: agregar 'combo' mas adelante es un valor nuevo de
  // lineType, no una columna nueva ni una regla de exclusividad que validar
  // a mano (ver SPEC-pos-sale-cycle.md, seccion "Discriminador de linea").
  @Column({ type: "varchar", length: 20, nullable: false, name: "tipo_linea" })
  lineType!: SaleItemLineType;

  // Id del inventory_item o del service_type, segun lineType. Sin FK real,
  // mismo criterio que InventoryMovement/CashMovement en este proyecto.
  @Column({ type: "bigint", nullable: false, name: "id_referencia" })
  referenceId!: string;

  @Column({ type: "int", nullable: false, name: "cantidad" })
  quantity!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "precio_unitario" })
  unitPrice!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0, name: "monto_descuento" })
  discountAmount!: string;
}
