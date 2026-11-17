import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { User } from "../../auth/entities/user.entity.js";
import { Branch } from "./branch.entity.js";

// Sucursales de un usuario que NO es owner (el owner accede a todas por rol y no
// tiene filas). Exactamente una es la principal: es la sucursal activa del
// usuario y no la puede cambiar.
@Entity("user_branches")
@Index("IDX_user_branches_tenant", ["tenantId"])
@Index("IDX_user_branches_user", ["userId"])
@Index("UQ_user_branches_user_branch", ["userId", "branchId"], { unique: true })
@Index("UQ_user_branches_one_primary", ["userId"], { unique: true, where: '"is_primary" = true' })
export class UserBranch extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_user_branches_tenant" })
  tenant?: Tenant;

  @Column({ type: "bigint", nullable: false, name: "user_id" })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id", foreignKeyConstraintName: "FK_user_branches_user" })
  user?: User;

  @Column({ type: "bigint", nullable: false, name: "branch_id" })
  branchId!: string;

  @ManyToOne(() => Branch, { onDelete: "CASCADE" })
  @JoinColumn({ name: "branch_id", foreignKeyConstraintName: "FK_user_branches_branch" })
  branch?: Branch;

  @Column({ type: "boolean", default: false, name: "is_primary" })
  isPrimary!: boolean;
}
