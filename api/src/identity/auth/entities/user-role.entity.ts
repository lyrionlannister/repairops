import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { User, USER_ROLES, type UserRole } from "./user.entity.js";

// Roles activos de un usuario; sus permisos son la unión (ver identity/authz). Que
// tenant_id coincida con el del usuario lo garantiza el service, igual que en user_branches.
@Entity("user_roles")
@Index("IDX_user_roles_tenant", ["tenantId"])
@Index("UQ_user_roles_user_role", ["userId", "role"], { unique: true })
export class UserRoleAssignment extends BaseEntity {
  @Column({ type: "bigint", name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_user_roles_tenant" })
  tenant?: Tenant;

  @Column({ type: "bigint", name: "user_id" })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id", foreignKeyConstraintName: "FK_user_roles_user" })
  user?: User;

  @Column({ type: "enum", enum: USER_ROLES, enumName: "user_role", name: "role" })
  role!: UserRole;

  @CreateDateColumn({ name: "fecha_creacion", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
