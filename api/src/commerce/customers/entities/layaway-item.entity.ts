import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Layaway } from "./layaway.entity.js";
import { InventoryItem } from "../../inventory/entities/inventory-item.entity.js";

@Entity("layaway_items")
export class LayawayItem extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @Column({ type: "bigint", nullable: false, name: "id_apartado" })
  layawayId!: string;

  @ManyToOne(() => Layaway, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_apartado" })
  layaway?: Layaway;

  @Column({ type: "bigint", nullable: false, name: "id_item_inventario" })
  inventoryItemId!: string;

  @ManyToOne(() => InventoryItem)
  @JoinColumn({ name: "id_item_inventario" })
  inventoryItem?: InventoryItem;

  @Column({ type: "int", nullable: false, name: "cantidad" })
  quantity!: number;

  // Precio bloqueado al momento del apartado -- mismo criterio que
  // SaleItem.unitPrice/RepairNoteItem.unitPrice, nunca se recalcula despues.
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false, name: "precio_unitario" })
  unitPrice!: number;
}
