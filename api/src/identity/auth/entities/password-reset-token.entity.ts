import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";

// Enlace de un solo uso para restablecer la contraseña. Solo se guarda el
// hash SHA-256, igual que EmailVerificationToken. Se resuelve sin sesión,
// así que su Dao no extiende TenantScopedDao.
@Entity("password_reset_tokens")
@Index("IDX_password_reset_tokens_tenant", ["tenantId", "userId"])
export class PasswordResetToken extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_password_reset_tokens_tenant" })
  tenant?: Tenant;

  @Column({ type: "bigint", nullable: false, name: "user_id" })
  userId!: string;

  @Column({ type: "varchar", length: 64, unique: true, name: "token_hash" })
  tokenHash!: string;

  @Column({ type: "timestamp", nullable: false, name: "expires_at" })
  expiresAt!: Date;

  @Column({ type: "timestamp", nullable: true, name: "consumed_at" })
  consumedAt!: Date | null;

  @CreateDateColumn({ name: "fecha_creacion", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
