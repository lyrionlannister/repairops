import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { InventoryItem } from "./inventory-item.entity.js";

// Cada InventoryItem es una fila propia por sucursal (local_id) -- "transferir"
// mueve cantidad entre dos filas YA EXISTENTES (una por sucursal), nunca entre
// sucursales como concepto abstracto. El caller (UI) resuelve el item destino
// por SKU; el backend solo valida que no sean la misma fila/sucursal.
@Entity("inventory_transfers")
export class InventoryTransfer extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @Column({ type: "bigint", nullable: false, name: "id_item_origen" })
  fromInventoryItemId!: string;

  @ManyToOne(() => InventoryItem)
  @JoinColumn({ name: "id_item_origen" })
  fromItem?: InventoryItem;

  @Column({ type: "bigint", nullable: false, name: "id_item_destino" })
  toInventoryItemId!: string;

  @ManyToOne(() => InventoryItem)
  @JoinColumn({ name: "id_item_destino" })
  toItem?: InventoryItem;

  @Column({ type: "int", nullable: false, name: "cantidad" })
  quantity!: number;

  @Column({ type: "text", nullable: true, name: "motivo" })
  reason!: string | null;

  @Column({ type: "bigint", nullable: true, name: "id_empleado_creador" })
  createdByEmployeeId!: string | null;

  @CreateDateColumn({ name: "fecha_creacion", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
