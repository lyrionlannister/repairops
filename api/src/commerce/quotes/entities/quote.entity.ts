import { Entity, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";

export type QuoteStatus = "pending" | "accepted" | "rejected";

@Entity("quotes")
@Index("IDX_quotes_tenant", ["tenantId"])
export class Quote extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_quotes_tenant" })
  tenant?: Tenant;

  @Column({ type: "bigint", nullable: false, name: "local_id" })
  localId!: string;

  @Column({ type: "bigint", nullable: true, name: "customer_id" })
  customerId?: string | null;

  @Column({ type: "varchar", length: 255, nullable: false, name: "nombre_cliente" })
  customerName!: string;

  @Column({ type: "varchar", length: 50, nullable: true, name: "numero_contacto" })
  contactNumber?: string | null;

  // Cacheado: la fuente de verdad es la suma de los QuoteItem, mantenida por
  // QuoteService en cada create/update (mismo patron que
  // InventoryItem.quantityOnHand respecto al ledger de movimientos).
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0, name: "valor_total" })
  totalValue!: number;

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
