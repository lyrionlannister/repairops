import { Column, CreateDateColumn, Entity } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";

// Invitación de un solo uso para crear un tenant cuando REGISTRATION_MODE
// es `invite`. Solo se guarda el hash SHA-256 del token: el valor en claro
// se muestra una sola vez al platform-admin que la crea. `email` es
// informativo (a quién se le envió); el registro no lo exige.
@Entity("tenant_invitations")
export class TenantInvitation extends BaseEntity {
  @Column({ type: "varchar", length: 64, unique: true, name: "token_hash" })
  tokenHash!: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "email" })
  email!: string | null;

  @Column({ type: "timestamp", nullable: false, name: "expires_at" })
  expiresAt!: Date;

  @Column({ type: "timestamp", nullable: true, name: "used_at" })
  usedAt!: Date | null;

  @Column({ type: "bigint", nullable: true, name: "created_by_admin_id" })
  createdByAdminId!: string | null;

  @CreateDateColumn({ name: "fecha_creacion", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
