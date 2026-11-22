import { Entity, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { Branch } from "../../../identity/branches/entities/branch.entity.js";

export type CashSessionStatus = "open" | "closed";

@Entity("cash_sessions")
@Index("IDX_cash_sessions_tenant", ["tenantId"])
@Index("IDX_cash_sessions_local", ["localId"])
export class CashSession extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_cash_sessions_tenant" })
  tenant?: Tenant;

  @Column({ type: "bigint", nullable: false, name: "local_id" })
  localId!: string;

  // NO ACTION: una sucursal con datos no se borra, se desactiva.
  @ManyToOne(() => Branch, { onDelete: "NO ACTION" })
  @JoinColumn({ name: "local_id", foreignKeyConstraintName: "FK_cash_sessions_local" })
  branch?: Branch;

  @Column({ type: "bigint", nullable: true, name: "id_empleado_apertura" })
  openedByEmployeeId?: string | null;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "saldo_apertura" })
  openingBalance!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true, name: "saldo_cierre" })
  closingBalance?: string | null;

  @Column({ type: "varchar", length: 10, default: "open", name: "estado" })
  status!: CashSessionStatus;

  // Snapshot inmutable del cierre -- igual criterio que Sale: una vez
  // cerrada, la sesión no se reabre ni esta columna se recalcula despues.
  // Un error de caja se corrige con un CashMovement nuevo, nunca editando
  // variance a mano (SPEC-fase3-pos-dinero.md).
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true, name: "diferencia" })
  variance?: string | null;

  @Column({ type: "text", nullable: true, name: "motivo_diferencia" })
  varianceReason?: string | null;

  @Column({ type: "bigint", nullable: true, name: "id_empleado_autoriza_diferencia" })
  varianceAuthorizedByEmployeeId?: string | null;

  @CreateDateColumn({ name: "fecha_apertura", default: () => "CURRENT_TIMESTAMP" })
  openedAt!: Date;

  @Column({ type: "timestamp", nullable: true, name: "fecha_cierre" })
  closedAt?: Date | null;

  @Column({ type: "bigint", nullable: true, name: "id_empleado_cierre" })
  closedByEmployeeId?: string | null;
}
