import { Entity, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, Check } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { Branch } from "../../../identity/branches/entities/branch.entity.js";
import { RepairNote } from "../../repair-notes/entities/repair-note.entity.js";

export type QuoteStatus = "pending" | "accepted" | "rejected";
// "product": venta de productos; "repair": cotiza una reparación y, al aceptarla, crea la nota.
export type QuoteKind = "product" | "repair";

@Entity("quotes")
@Index("IDX_quotes_tenant", ["tenantId"])
@Index("IDX_quotes_local", ["localId"])
@Check("CHK_quotes_tipo", `"tipo" IN ('product', 'repair')`)
@Check("CHK_quotes_reparacion_datos", `"tipo" = 'product' OR ("marca" IS NOT NULL AND "modelo" IS NOT NULL AND "falla_reportada" IS NOT NULL)`)
export class Quote extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_quotes_tenant" })
  tenant?: Tenant;

  @Column({ type: "bigint", nullable: false, name: "local_id" })
  localId!: string;

  // NO ACTION: una sucursal con datos no se borra, se desactiva.
  @ManyToOne(() => Branch, { onDelete: "NO ACTION" })
  @JoinColumn({ name: "local_id", foreignKeyConstraintName: "FK_quotes_local" })
  branch?: Branch;

  @Column({ type: "varchar", length: 20, default: "product", name: "tipo" })
  kind!: QuoteKind;

  @Column({ type: "bigint", nullable: true, name: "customer_id" })
  customerId?: string | null;

  @Column({ type: "varchar", length: 255, nullable: false, name: "nombre_cliente" })
  customerName!: string;

  @Column({ type: "varchar", length: 50, nullable: true, name: "numero_contacto" })
  contactNumber?: string | null;

  // Solo cotizaciones de reparación (un CHECK de la BD los exige cuando tipo = 'repair').
  @Column({ type: "varchar", length: 255, nullable: true, name: "marca" })
  brand?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true, name: "modelo" })
  model?: string | null;

  @Column({ type: "text", nullable: true, name: "falla_reportada" })
  reportedFailure?: string | null;

  // Nota creada al aceptar una cotización de reparación.
  @Column({ type: "bigint", nullable: true, name: "id_nota_reparacion" })
  repairNoteId?: string | null;

  @ManyToOne(() => RepairNote, { onDelete: "SET NULL" })
  @JoinColumn({ name: "id_nota_reparacion", foreignKeyConstraintName: "FK_quotes_id_nota_reparacion" })
  repairNote?: RepairNote;

  // Cacheado: la fuente de verdad es la suma de los QuoteItem, mantenida por
  // QuoteService en cada create/update (mismo patron que
  // InventoryItem.quantityOnHand respecto al ledger de movimientos).
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0, name: "valor_total" })
  totalValue!: string;

  @Column({ type: "date", nullable: true, name: "valido_hasta" })
  validUntil?: string | null;

  @Column({ type: "varchar", length: 20, default: "pending", name: "estado" })
  status!: QuoteStatus;

  @Column({ type: "bigint", nullable: true, name: "id_empleado_creador" })
  createdByEmployeeId?: string | null;

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
