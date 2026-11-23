import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { RepairNote } from "./repair-note.entity.js";

export type RepairNotePaymentKind = "advance" | "delivery";
export type RepairNotePaymentMethod = "efectivo" | "tarjeta" | "transferencia" | "credito";

// Pagos de una nota: el anticipo (al recibir el equipo) y el cobro de la entrega,
// que puede dividirse entre métodos o quedar a crédito. Fuente de verdad de lo
// cobrado; los métodos que no son crédito generan además su movimiento de caja.
// El saldo a crédito de un cliente suma los pagos "credito" de estas filas y
// los de sus ventas (nunca se cachea).
@Entity("repair_note_payments")
@Index("IDX_repair_note_payments_tenant", ["tenantId"])
@Index("IDX_repair_note_payments_id_nota_reparacion", ["repairNoteId"])
@Check("CHK_repair_note_payments_tipo", `"tipo" IN ('advance', 'delivery')`)
@Check("CHK_repair_note_payments_metodo", `"metodo" IN ('efectivo', 'tarjeta', 'transferencia', 'credito')`)
@Check("CHK_repair_note_payments_monto", `"monto" > 0`)
@Check("CHK_repair_note_payments_fecha_vencimiento", `"metodo" = 'credito' OR "fecha_vencimiento" IS NULL`)
export class RepairNotePayment extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_repair_note_payments_tenant" })
  tenant?: Tenant;

  @Column({ type: "bigint", nullable: false, name: "id_nota_reparacion" })
  repairNoteId!: string;

  @ManyToOne(() => RepairNote, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_nota_reparacion", foreignKeyConstraintName: "FK_repair_note_payments_id_nota_reparacion" })
  repairNote?: RepairNote;

  @Column({ type: "varchar", length: 20, nullable: false, name: "tipo" })
  kind!: RepairNotePaymentKind;

  @Column({ type: "varchar", length: 20, nullable: false, name: "metodo" })
  method!: RepairNotePaymentMethod;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false, name: "monto" })
  amount!: string;

  // Nullable solo por los creditos anteriores a la fecha limite: todo credito nuevo la exige (RepairNoteService.deliver).
  @Column({ type: "date", nullable: true, name: "fecha_vencimiento" })
  dueDate?: string | null;

  @Column({ type: "timestamp", nullable: false, default: () => "now()", name: "fecha_creacion" })
  createdAt!: Date;
}
