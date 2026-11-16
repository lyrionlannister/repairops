import { Entity, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Supplier } from "../../suppliers/entities/supplier.entity.js";

export type InventoryItemKind = "accessory" | "part";

@Entity("inventory_items")
export class InventoryItem extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @Column({ type: "bigint", nullable: false, name: "local_id" })
  localId!: string;

  @Column({ type: "varchar", length: 255, nullable: false, name: "nombre" })
  name!: string;

  @Column({ type: "varchar", length: 100, nullable: true, name: "sku" })
  sku!: string | null;

  // Opcional: no todo item tiene un proveedor conocido (ej. ajustes manuales
  // de inventario). SET NULL en vez de CASCADE -- a diferencia de
  // PriceListItem, un item de inventario sigue teniendo sentido sin
  // proveedor asociado.
  @Column({ type: "bigint", nullable: true, name: "id_proveedor" })
  supplierId!: string | null;

  @ManyToOne(() => Supplier, { nullable: true, onDelete: "SET NULL", eager: false })
  @JoinColumn({ name: "id_proveedor" })
  supplier?: Supplier | null;

  @Column({ type: "varchar", length: 20, default: "accessory", name: "tipo" })
  kind!: InventoryItemKind;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "precio_costo" })
  costPrice!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "precio_venta" })
  salePrice!: number;

  // Cacheado: la fuente de verdad es la suma del ledger en inventory_movements,
  // pero se mantiene esta columna actualizada atomicamente (ver
  // InventoryService.applyMovement) para no tener que agregar el ledger
  // completo en cada lectura de la lista.
  @Column({ type: "int", default: 0, name: "cantidad_disponible" })
  quantityOnHand!: number;

  // 0 = sin alerta configurada. InventoryItemDao.findLowStock compara
  // quantityOnHand <= minStock, igual criterio que usa la pantalla.
  @Column({ type: "int", default: 0, name: "stock_minimo" })
  minStock!: number;

  @CreateDateColumn({ name: "fecha_creacion", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "fecha_actualizacion",
    default: null,
    onUpdate: "CURRENT_TIMESTAMP",
    nullable: true,
  })
  updatedAt!: Date;
}
