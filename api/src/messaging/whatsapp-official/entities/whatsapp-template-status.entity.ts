import {
  Column,
  CreateDateColumn,
  Entity,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";

export type WhatsappTemplateSyncStatus = "PENDING" | "APPROVED" | "REJECTED";

// Una fila por (tenant, plantilla del catálogo) -- aunque en Etapa 1 varios
// tenants comparten la misma WABA piloto (ver WhatsappAccount), cada uno
// lleva su propio registro de sincronización; el servicio evita crear la
// misma plantilla dos veces en Meta cuando ya existe en esa WABA.
@Entity("whatsapp_template_statuses")
@Unique(["tenantId", "catalogKey"])
export class WhatsappTemplateStatus extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @Column({ type: "bigint", nullable: false, name: "account_id" })
  accountId!: string;

  @Column({ type: "varchar", length: 100, nullable: false, name: "catalog_key" })
  catalogKey!: string;

  @Column({ type: "varchar", length: 50, nullable: true, name: "meta_template_id" })
  metaTemplateId!: string | null;

  @Column({ type: "varchar", length: 20, default: "PENDING", name: "status" })
  status!: WhatsappTemplateSyncStatus;

  @Column({ type: "timestamp", nullable: true, name: "fecha_ultima_sincronizacion" })
  lastSyncedAt!: Date | null;

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
