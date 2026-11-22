import { Entity, Column, CreateDateColumn, UpdateDateColumn, Unique, Index, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { Branch } from "../../../identity/branches/entities/branch.entity.js";

@Entity("repair_notes")
@Unique(["tenantId", "controlNumber"])
@Index("IDX_repair_notes_tenant_received", ["tenantId", "receivedAt"])
@Index("IDX_repair_notes_tenant_status", ["tenantId", "status"])
@Index("UQ_repair_notes_public_ref", ["publicRef"], { unique: true })
@Index("IDX_repair_notes_local", ["localId"])
export class RepairNote extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_repair_notes_tenant" })
  tenant?: Tenant;

  // Sucursal de la nota: obligatoria (el dashboard y la caja filtran por ella).
  @Column({ type: "bigint", nullable: false, name: "local_id" })
  localId!: string;

  // NO ACTION: una sucursal con datos no se borra, se desactiva.
  @ManyToOne(() => Branch, { onDelete: "NO ACTION" })
  @JoinColumn({ name: "local_id", foreignKeyConstraintName: "FK_repair_notes_local" })
  branch?: Branch;

  @Column({ type: "bigint", nullable: true, name: "customer_id" })
  customerId?: string | null;

  @Column({ type: "int", name: "numero_control" })
  controlNumber!: number;

  // Referencia publica para consultar la nota por WhatsApp (QR impreso). Unica
  // en toda la tabla: asi se resuelve el tenant en la cuenta compartida.
  @Column({ type: "varchar", length: 8, nullable: false, name: "public_ref" })
  publicRef!: string;

  @Column({ type: "varchar", length: 255, nullable: false, name: "nombre_cliente" })
  customerName!: string;

  @Column({ type: "varchar", length: 50, nullable: true, name: "numero_contacto" })
  contactNumber?: string;

  @Column({ type: "varchar", length: 255, nullable: false, name: "marca" })
  brand!: string;

  @Column({ type: "varchar", length: 255, nullable: false, name: "modelo" })
  model!: string;

  @Column({ type: "text", nullable: false, name: "falla_reportada" })
  reportedFailure!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0, name: "valor_total" })
  totalValue!: string;

  @Column({ type: "varchar", length: 50, default: "received", name: "estado" })
  status!: string;

  @Column({ type: "boolean", default: false, name: "requiere_anticipo" })
  requiresAdvance!: boolean;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true, name: "valor_anticipo" })
  advanceValue?: string;

  @Column({ type: "date", name: "fecha_recepcion" })
  receivedAt!: string;

  // Hora de recepcion en la zona horaria del local (HH:MM), calculada por
  // RepairNoteService.create -- fecha_recepcion no guarda hora, y los tres
  // tickets (58mm, 80mm, carta) la necesitan para mostrarla junto a la fecha.
  @Column({ type: "varchar", length: 5, name: "hora_recepcion" })
  receivedTime!: string;

  @Column({ type: "date", nullable: true, name: "fecha_entrega" })
  deliveryDate?: string;

  @Column({ type: "text", nullable: true, name: "notas_tecnico" })
  technicianNotes?: string;

  @Column({ type: "text", nullable: true, name: "hallazgos_adicionales" })
  additionalFindings?: string;

  @Column({ type: "bigint", nullable: true, name: "id_empleado_asignado" })
  assignedEmployeeId?: string | null;

  @Column({ type: "boolean", default: false, name: "dispositivo_apagado" })
  deviceOff!: boolean;

  @Column({ type: "boolean", default: false, name: "tiene_garantia" })
  hasWarranty!: boolean;

  @Column({ type: "boolean", default: false, name: "tiene_garantia_extendida" })
  hasExtendedWarranty!: boolean;

  @Column({ type: "int", nullable: true, name: "dias_garantia_extendida" })
  extendedWarrantyDays?: number;

  @CreateDateColumn({
    name: "fecha_creacion",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "fecha_actualizacion",
    default: null,
    onUpdate: "CURRENT_TIMESTAMP",
    nullable: true,
  })
  updatedAt!: Date;
}
