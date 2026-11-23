import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { RepairNote } from "./repair-note.entity.js";
import { RepairNoteDevice } from "./repair-note-device.entity.js";
import { ServiceType } from "../../service-types/entities/service-type.entity.js";

// El tipo de servicio es de cada equipo. id_nota_reparacion se conserva para leer y
// reportar por nota; que el equipo sea de esa misma nota lo garantiza el Service,
// que crea equipo y enlaces juntos en la misma transaccion.
@Entity("repair_note_service_types")
@Index("IDX_repair_note_service_types_tenant", ["tenantId"])
@Index("IDX_repair_note_service_types_id_nota_reparacion", ["repairNoteId"])
@Index("IDX_repair_note_service_types_id_tipo_servicio", ["serviceTypeId"])
@Unique("UQ_repair_note_service_types_equipo_tipo", ["repairNoteDeviceId", "serviceTypeId"])
export class RepairNoteServiceType extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_repair_note_service_types_tenant" })
  tenant?: Tenant;

  @Column({ type: "bigint", nullable: false, name: "id_nota_reparacion" })
  repairNoteId!: string;

  @ManyToOne(() => RepairNote, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_nota_reparacion", foreignKeyConstraintName: "FK_repair_note_service_types_id_nota_reparacion" })
  repairNote?: RepairNote;

  @Column({ type: "bigint", nullable: false, name: "id_equipo_nota" })
  repairNoteDeviceId!: string;

  @ManyToOne(() => RepairNoteDevice, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_equipo_nota", foreignKeyConstraintName: "FK_repair_note_service_types_id_equipo_nota" })
  repairNoteDevice?: RepairNoteDevice;

  @Column({ type: "bigint", nullable: false, name: "id_tipo_servicio" })
  serviceTypeId!: string;

  @ManyToOne(() => ServiceType, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_tipo_servicio", foreignKeyConstraintName: "FK_repair_note_service_types_id_tipo_servicio" })
  serviceType?: ServiceType;
}
