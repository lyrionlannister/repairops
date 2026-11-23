import { Column, CreateDateColumn, Entity, Index } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";

// Sesión de refresco: un token opaco por inicio de sesión, guardado solo
// como hash SHA-256 (el valor en claro solo existe en la cookie httpOnly).
// Rotación en cada uso: al refrescar, el token viejo se revoca y se apunta
// al nuevo en `replacedByTokenHash` -- si un token revocado con reemplazo
// vuelve a presentarse, es robo (reutilización) y se revoca toda la familia.
@Entity("refresh_tokens")
@Index("IDX_refresh_tokens_user", ["userId", "tenantId"])
export class RefreshToken extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @Column({ type: "bigint", nullable: false, name: "user_id" })
  userId!: string;

  @Column({ type: "varchar", length: 64, unique: true, name: "token_hash" })
  tokenHash!: string;

  @Column({ type: "varchar", length: 64, nullable: true, name: "replaced_by_token_hash" })
  replacedByTokenHash!: string | null;

  @Column({ type: "timestamp", nullable: false, name: "expires_at" })
  expiresAt!: Date;

  @Column({ type: "timestamp", nullable: true, name: "revoked_at" })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: "fecha_creacion", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
