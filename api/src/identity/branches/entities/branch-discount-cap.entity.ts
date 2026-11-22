import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { USER_ROLES, type UserRole } from "../../auth/entities/user.entity.js";
import { Branch } from "./branch.entity.js";

// Sin fila para un rol en una sucursal = ese rol no puede dar descuento ahí. El owner
// nunca lleva fila: no tiene tope.
@Entity("branch_discount_caps")
@Index("IDX_branch_discount_caps_tenant", ["tenantId"])
@Index("UQ_branch_discount_caps_branch_role", ["branchId", "role"], { unique: true })
@Check("CHK_branch_discount_caps_range", `"max_discount_percent" >= 0 AND "max_discount_percent" <= 100`)
export class BranchDiscountCap extends BaseEntity {
  @Column({ type: "bigint", name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_branch_discount_caps_tenant" })
  tenant?: Tenant;

  @Column({ type: "bigint", name: "branch_id" })
  branchId!: string;

  @ManyToOne(() => Branch, { onDelete: "CASCADE" })
  @JoinColumn({ name: "branch_id", foreignKeyConstraintName: "FK_branch_discount_caps_branch" })
  branch?: Branch;

  @Column({ type: "enum", enum: USER_ROLES, enumName: "user_role", name: "role" })
  role!: UserRole;

  @Column({ type: "decimal", precision: 5, scale: 2, name: "max_discount_percent" })
  maxDiscountPercent!: string;
}
