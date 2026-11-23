import { Entity, Column, ManyToOne, JoinColumn, Index, Unique, Check } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { RepairNote } from "./repair-note.entity.js";

// Equipos recibidos en una nota (1..N). Estado, total, anticipo, tipos de servicio y
// refacciones siguen siendo de la nota: se reciben, cobran y entregan juntos.
@Entity("repair_note_devices")
@Index("IDX_repair_note_devices_tenant", ["tenantId"])
@Unique("UQ_repair_note_devices_nota_posicion", ["repairNoteId", "position"])
@Check("CHK_repair_note_devices_posicion", `"posicion" >= 0`)
export class RepairNoteDevice extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_repair_note_devices_tenant" })
  tenant?: Tenant;

  @Column({ type: "bigint", nullable: false, name: "id_nota_reparacion" })
  repairNoteId!: string;

  @ManyToOne(() => RepairNote, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_nota_reparacion", foreignKeyConstraintName: "FK_repair_note_devices_id_nota_reparacion" })
  repairNote?: RepairNote;

  @Column({ type: "int", nullable: false, name: "posicion" })
  position!: number;

  @Column({ type: "varchar", length: 255, nullable: false, name: "marca" })
  brand!: string;

  @Column({ type: "varchar", length: 255, nullable: false, name: "modelo" })
  model!: string;

  @Column({ type: "text", nullable: false, name: "falla_reportada" })
  reportedFailure!: string;

  @Column({ type: "boolean", nullable: false, default: false, name: "dispositivo_apagado" })
  deviceOff!: boolean;
}
