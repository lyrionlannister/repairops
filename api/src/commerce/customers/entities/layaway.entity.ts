import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, Index } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Customer } from "./customer.entity.js";
import type { CashMovementMethod } from "../../cash/entities/cash-movement.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";

export type LayawayStatus = "open" | "completed" | "cancelled" | "expired";

// Completar un apartado NUNCA genera una Sale -- SaleService.create ya
// descuenta stock directo con applyMovement("out"); si el apartado tambien
// consumiera su reserva, el mismo stock se descontaria dos veces. El
// anticipo y el saldo final quedan como dos CashMovement "income"
// independientes, igual de auditables en caja (ver SPEC-fase5-pos-total.md,
// Rama Cliente).
@Entity("layaways")
@Index("IDX_layaways_tenant", ["tenantId"])
export class Layaway extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_layaways_tenant" })
  tenant?: Tenant;

  @Column({ type: "bigint", nullable: false, name: "id_cliente" })
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: "id_cliente" })
  customer?: Customer;

  @Column({ type: "varchar", length: 10, default: "open", name: "estado" })
  status!: LayawayStatus;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false, name: "valor_total" })
  totalValue!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false, name: "monto_anticipo" })
  depositAmount!: number;

  @Column({ type: "varchar", length: 20, nullable: false, name: "metodo_anticipo" })
  depositMethod!: CashMovementMethod;

  @Column({ type: "date", nullable: false, name: "fecha_vencimiento" })
  expiresAt!: string;

  @Column({ type: "bigint", nullable: true, name: "id_empleado_creador" })
  createdByEmployeeId!: string | null;

  @CreateDateColumn({ name: "fecha_creacion", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @Column({ type: "timestamp", nullable: true, name: "fecha_completado" })
  completedAt!: Date | null;

  @Column({ type: "timestamp", nullable: true, name: "fecha_cancelado" })
  cancelledAt!: Date | null;

  @Column({ type: "timestamp", nullable: true, name: "fecha_vencido" })
  expiredAt!: Date | null;
}
