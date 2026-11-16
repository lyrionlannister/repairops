import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Return } from "./return.entity.js";
import { SaleItem } from "../../inventory/entities/sale-item.entity.js";

// "Cuanto ya se devolvio de esta linea" se responde SUMANDO quantity contra
// SaleItem.quantity en cada validacion -- nunca con una columna cacheada en
// SaleItem (prohibicion explicita de SPEC-pos-sale-cycle.md). La proteccion
// de esa invariante vive en ReturnService (lock pesimista + suma agregada
// dentro de la transaccion), no en una constraint de DB.
@Entity("return_items")
export class ReturnItem extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @Column({ type: "bigint", nullable: false, name: "id_devolucion" })
  returnId!: string;

  // Borrar una Return se lleva sus lineas -- aunque hoy no hay flujo de
  // borrado de Return, mismo criterio preventivo que WhatsappTemplateStatus.
  @ManyToOne(() => Return, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_devolucion" })
  return?: Return;

  @Column({ type: "bigint", nullable: false, name: "id_item_venta" })
  saleItemId!: string;

  // SaleItem nunca se borra (SPEC-pos-sale-cycle.md) -- sin cascada.
  @ManyToOne(() => SaleItem)
  @JoinColumn({ name: "id_item_venta" })
  saleItem?: SaleItem;

  @Column({ type: "int", nullable: false, name: "cantidad" })
  quantity!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "monto_reembolsado" })
  refundAmount!: number;
}
