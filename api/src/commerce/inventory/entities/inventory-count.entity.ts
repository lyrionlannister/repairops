import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Branch } from "../../../identity/branches/entities/branch.entity.js";

export type InventoryCountStatus = "open" | "closed";

// Columna nueva -> FK real desde el dia uno (ver db-schema-design item 4),
// a diferencia de InventoryItem.localId/Sale.localId (legado sin FK, no se
// retrofitea aqui).
@Entity("inventory_counts")
export class InventoryCount extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @Column({ type: "bigint", nullable: false, name: "branch_id" })
  branchId!: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: "branch_id" })
  branch?: Branch;

  @Column({ type: "varchar", length: 10, default: "open", name: "estado" })
  status!: InventoryCountStatus;

  @Column({ type: "bigint", nullable: true, name: "id_empleado_apertura" })
  openedByEmployeeId!: string | null;

  @Column({ type: "bigint", nullable: true, name: "id_empleado_cierre" })
  closedByEmployeeId!: string | null;

  @CreateDateColumn({ name: "fecha_apertura", default: () => "CURRENT_TIMESTAMP" })
  openedAt!: Date;

  @Column({ type: "timestamp", nullable: true, name: "fecha_cierre" })
  closedAt!: Date | null;
}
