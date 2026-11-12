import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
} from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { encryptedColumnTransformer } from "../../../core/security/encrypted-column.transformer.js";

export type WhatsappAccountStatus = "connected" | "disconnected";

// Una fila por tenant -- reemplaza al status en memoria de whatsapp-web.js
// (ver plan Fase 4, Checkpoint 1). Etapa 1: todas las filas apuntan a la
// misma cuenta piloto (ownedByPlatform: true); Etapa 2 (Embedded Signup)
// agrega filas con credenciales propias por taller sin cambiar esta forma.
@Entity("whatsapp_accounts")
export class WhatsappAccount extends BaseEntity {
  @Column({ type: "bigint", nullable: false, unique: true, name: "tenant_id" })
  tenantId!: string;

  @Column({ type: "varchar", length: 50, nullable: false, name: "waba_id" })
  wabaId!: string;

  @Column({ type: "varchar", length: 50, nullable: false, name: "phone_number_id" })
  phoneNumberId!: string;

  @Column({
    type: "text",
    nullable: false,
    name: "access_token",
    transformer: encryptedColumnTransformer,
  })
  accessToken!: string;

  // true = cuenta piloto compartida de la plataforma (Etapa 1); false =
  // cuenta propia del taller conectada vía Embedded Signup (Etapa 2).
  @Column({ type: "boolean", default: true, name: "owned_by_platform" })
  ownedByPlatform!: boolean;

  @Column({ type: "varchar", length: 20, default: "connected", name: "status" })
  status!: WhatsappAccountStatus;

  @CreateDateColumn({
    name: "fecha_creacion",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "fecha_actualizacion",
    default: null,
    onUpdate: "CURRENT_TIMESTAMP",
    nullable: true,
  })
  updatedAt!: Date;
}
