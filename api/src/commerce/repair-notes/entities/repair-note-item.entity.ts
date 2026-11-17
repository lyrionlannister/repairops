import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { RepairNote } from "./repair-note.entity.js";

@Entity("repair_note_items")
@Index("IDX_repair_note_items_tenant", ["tenantId"])
@Index("IDX_repair_note_items_id_nota_reparacion", ["repairNoteId"])
export class RepairNoteItem extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_repair_note_items_tenant" })
  tenant?: Tenant;

  @Column({ type: "bigint", nullable: false, name: "id_nota_reparacion" })
  repairNoteId!: string;

  @ManyToOne(() => RepairNote, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_nota_reparacion", foreignKeyConstraintName: "FK_repair_note_items_id_nota_reparacion" })
  repairNote?: RepairNote;

  @Column({ type: "bigint", nullable: false, name: "id_item_inventario" })
  inventoryItemId!: string;

  @Column({ type: "int", nullable: false, name: "cantidad" })
  quantity!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "precio_unitario" })
  unitPrice!: number;
}
