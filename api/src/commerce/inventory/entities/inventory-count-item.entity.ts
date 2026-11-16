import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { InventoryCount } from "./inventory-count.entity.js";
import { InventoryItem } from "./inventory-item.entity.js";
import { InventoryMovement } from "./inventory-movement.entity.js";

// Arqueo ciego: el esperado NUNCA se guarda aqui -- se lee de
// InventoryItem.quantityOnHand EN VIVO al momento de cerrar el conteo
// (InventoryCountService.close), mismo criterio que CashService.closeSession.
@Entity("inventory_count_items")
export class InventoryCountItem extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @Column({ type: "bigint", nullable: false, name: "id_conteo" })
  countId!: string;

  @ManyToOne(() => InventoryCount, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_conteo" })
  count?: InventoryCount;

  @Column({ type: "bigint", nullable: false, name: "id_item_inventario" })
  inventoryItemId!: string;

  @ManyToOne(() => InventoryItem)
  @JoinColumn({ name: "id_item_inventario" })
  item?: InventoryItem;

  // Null = no contado todavia.
  @Column({ type: "int", nullable: true, name: "cantidad_contada" })
  countedQuantity!: number | null;

  @Column({ type: "text", nullable: true, name: "motivo" })
  reason!: string | null;

  // Trazabilidad de que movimiento resulto al cerrar -- puntero a un hecho
  // ya ocurrido, no un atributo derivado (ver db-schema-design item 3).
  @Column({ type: "bigint", nullable: true, name: "id_movimiento_aplicado" })
  appliedMovementId!: string | null;

  @ManyToOne(() => InventoryMovement)
  @JoinColumn({ name: "id_movimiento_aplicado" })
  appliedMovement?: InventoryMovement;
}
