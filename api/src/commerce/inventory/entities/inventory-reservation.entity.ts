import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, Unique } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { InventoryItem } from "./inventory-item.entity.js";
import { InventoryMovement } from "./inventory-movement.entity.js";

export type InventoryReservationStatus = "active" | "released" | "consumed";
// Fase 5: dos origenes posibles (nota de reparacion, apartado) -- umbral
// donde el ítem 2 de db-schema-design pasa de "no inventes un discriminador
// para un solo valor" a "replica el patron ya establecido" (mismo criterio
// que InventoryMovement/CashMovement.relatedEntityType). Sin FK real posible
// (apunta a una de dos tablas distintas) -- a diferencia del resto de este
// Entity, que sí tiene FK real porque su destino es unico y conocido.
export type InventoryReservationRelatedEntityType = "repair_note_item" | "layaway_item";

@Entity("inventory_reservations")
@Unique("UQ_inventory_reservations_related_entity", ["relatedEntityType", "relatedEntityId"])
export class InventoryReservation extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @Column({ type: "varchar", length: 20, nullable: false, name: "tipo_entidad_relacionada" })
  relatedEntityType!: InventoryReservationRelatedEntityType;

  @Column({ type: "bigint", nullable: false, name: "id_entidad_relacionada" })
  relatedEntityId!: string;

  // Denormalizado a proposito desde la linea de origen -- evita un join cada
  // vez que se calcula disponible (lectura mucho mas frecuente que escritura).
  @Column({ type: "bigint", nullable: false, name: "id_item_inventario" })
  @Index()
  inventoryItemId!: string;

  @ManyToOne(() => InventoryItem)
  @JoinColumn({ name: "id_item_inventario" })
  inventoryItem?: InventoryItem;

  @Column({ type: "int", nullable: false, name: "cantidad" })
  quantity!: number;

  @Column({ type: "varchar", length: 10, default: "active", name: "estado" })
  status!: InventoryReservationStatus;

  // Trazabilidad de que movimiento real resulto al consumir -- mismo
  // criterio que InventoryCountItem.appliedMovementId.
  @Column({ type: "bigint", nullable: true, name: "id_movimiento_consumo" })
  consumedMovementId!: string | null;

  @ManyToOne(() => InventoryMovement)
  @JoinColumn({ name: "id_movimiento_consumo" })
  consumedMovement?: InventoryMovement;

  @CreateDateColumn({ name: "fecha_creacion", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @Column({ type: "timestamp", nullable: true, name: "fecha_resolucion" })
  resolvedAt!: Date | null;
}
