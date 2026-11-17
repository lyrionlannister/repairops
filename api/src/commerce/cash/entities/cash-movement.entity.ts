import { Entity, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { CashSession } from "./cash-session.entity.js";

export type CashMovementType = "income" | "expense";
export type CashMovementMethod = "efectivo" | "tarjeta" | "transferencia";
export type CashMovementRelatedEntityType = "repair_note" | "quote" | "sale" | "return" | "layaway" | "manual";

@Entity("cash_movements")
@Index("IDX_cash_movements_tenant_created", ["tenantId", "createdAt"])
@Index("IDX_cash_movements_id_sesion_caja", ["cashSessionId"])
export class CashMovement extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_cash_movements_tenant" })
  tenant?: Tenant;

  @Column({ type: "bigint", nullable: false, name: "id_sesion_caja" })
  cashSessionId!: string;

  @ManyToOne(() => CashSession, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_sesion_caja", foreignKeyConstraintName: "FK_cash_movements_id_sesion_caja" })
  cashSession?: CashSession;

  @Column({ type: "varchar", length: 10, nullable: false, name: "tipo" })
  type!: CashMovementType;

  @Column({ type: "varchar", length: 20, nullable: false, name: "metodo" })
  method!: CashMovementMethod;

  // Monto ya redondeado (si aplica) al momento de registrar el movimiento --
  // nunca se recalcula despues, asi el total de la sesion siempre cuadra con
  // la suma de sus movimientos.
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false, name: "monto" })
  amount!: number;

  @Column({ type: "varchar", length: 20, default: "manual", name: "tipo_entidad_relacionada" })
  relatedEntityType!: CashMovementRelatedEntityType;

  @Column({ type: "bigint", nullable: true, name: "id_entidad_relacionada" })
  relatedEntityId?: string | null;

  @Column({ type: "text", nullable: true, name: "nota" })
  note?: string | null;

  @Column({ type: "bigint", nullable: true, name: "id_empleado_creador" })
  createdByEmployeeId?: string | null;

  @CreateDateColumn({ name: "fecha_creacion", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
