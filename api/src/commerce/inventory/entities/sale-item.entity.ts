import { Entity, Column } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";

export type SaleItemLineType = "inventory_item" | "service_type";

@Entity("sale_items")
export class SaleItem extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @Column({ type: "bigint", nullable: false, name: "id_venta" })
  saleId!: string;

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
  unitPrice!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0, name: "monto_descuento" })
  discountAmount!: number;
}
