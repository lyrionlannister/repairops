import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";

// Token opaco de un solo uso para verificar el correo del owner tras el
// registro público. Solo se guarda su hash SHA-256, igual que RefreshToken
// y TenantInvitation. Sin tenant en contexto todavía en el momento en que se
// resuelve (el usuario llega con el link, no con sesión activa necesariamente),
// así que este Dao no extiende TenantScopedDao -- mismo criterio que
// RefreshTokenDao/TenantInvitationDao.
@Entity("email_verification_tokens")
@Index("IDX_email_verification_tokens_tenant", ["tenantId", "userId"])
export class EmailVerificationToken extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "tenant_id",
    foreignKeyConstraintName: "FK_email_verification_tokens_tenant",
  })
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
