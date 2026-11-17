import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, Unique, UpdateDateColumn, Index } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { WhatsappTemplateCatalogEntry } from "./whatsapp-template-catalog-entry.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { WhatsappAccount } from "./whatsapp-account.entity.js";

export type WhatsappTemplateSyncStatus = "PENDING" | "APPROVED" | "REJECTED";

// Una fila por (tenant, plantilla del catálogo) -- aunque en Etapa 1 varios
// tenants comparten la misma WABA piloto (ver WhatsappAccount), cada uno
// lleva su propio registro de sincronización; el servicio evita crear la
// misma plantilla dos veces en Meta cuando ya existe en esa WABA.
@Entity("whatsapp_template_statuses")
@Unique(["tenantId", "catalogEntryId"])
@Index("IDX_whatsapp_template_statuses_account_id", ["accountId"])
export class WhatsappTemplateStatus extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_whatsapp_template_statuses_tenant" })
  tenant?: Tenant;

  @Column({ type: "bigint", nullable: false, name: "account_id" })
  accountId!: string;

  @ManyToOne(() => WhatsappAccount, { onDelete: "CASCADE" })
  @JoinColumn({ name: "account_id", foreignKeyConstraintName: "FK_whatsapp_template_statuses_account_id" })
  account?: WhatsappAccount;

  // FK real (ver plan Fase 4, Checkpoint 7, db-schema-design item 4) --
  // antes era un varchar suelto que comparaba contra el `key` del arreglo
  // hardcodeado; ahora que el catalogo es una tabla real, la referencia
  // tambien lo es. `onDelete: CASCADE`: borrar la entrada del catalogo borra
  // su fila de sincronizacion, nunca al reves.
  @Column({ type: "bigint", nullable: false, name: "catalog_entry_id" })
  catalogEntryId!: string;

  @ManyToOne(() => WhatsappTemplateCatalogEntry, { onDelete: "CASCADE" })
  @JoinColumn({ name: "catalog_entry_id" })
  catalogEntry?: WhatsappTemplateCatalogEntry;

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
