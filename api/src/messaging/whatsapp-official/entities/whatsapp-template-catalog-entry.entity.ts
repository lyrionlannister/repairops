import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";

export type WhatsappTemplateCategory = "UTILITY" | "MARKETING" | "AUTHENTICATION";

// Fuente de verdad del catalogo de plantillas proactivas (ver plan Fase 4,
// Checkpoint 7) -- reemplaza al arreglo hardcodeado templates/catalog.ts.
// `tenantId` NULL identifica una fila "de sistema" (configuracion de la
// plataforma misma, no de ningun taller -- ej. a futuro, la cuenta propia de
// RepairOps). Esta es la excepcion documentada a la convencion de
// "tenant_id en cada tabla": global y deliberado, no un olvido. La unicidad
// de filas de sistema (dos NULL nunca son iguales para un UNIQUE normal) la
// protegen los indices parciales que crea la migracion, no este decorator.
@Entity("whatsapp_template_catalog_entries")
@Unique(["tenantId", "key"])
@Unique(["tenantId", "metaName"])
@Index("UQ_wa_template_catalog_system_key", ["key"], { unique: true, where: '"tenant_id" IS NULL' })
@Index("UQ_wa_template_catalog_system_meta_name", ["metaName"], { unique: true, where: '"tenant_id" IS NULL' })
export class WhatsappTemplateCatalogEntry extends BaseEntity {
  @Column({ type: "bigint", nullable: true, name: "tenant_id" })
  tenantId!: string | null;

  @Column({ type: "varchar", length: 100, nullable: false, name: "key" })
  key!: string;

  @Column({ type: "varchar", length: 100, nullable: false, name: "meta_name" })
  metaName!: string;

  @Column({ type: "enum", enum: ["UTILITY", "MARKETING", "AUTHENTICATION"], enumName: "whatsapp_template_category", name: "category" })
  category!: WhatsappTemplateCategory;

  @Column({ type: "varchar", length: 20, nullable: false, name: "language" })
  language!: string;

  @Column({ type: "text", nullable: false, name: "text" })
  text!: string;

  @Column({ type: "jsonb", nullable: false, default: () => "'[]'", name: "variables" })
  variables!: string[];

  // Solo las filas con disparador automatico (ej. order_ready) lo tienen --
  // una plantilla creada a mano por el admin no dispara nada sola.
  @Column({ type: "varchar", length: 100, nullable: true, name: "trigger_event" })
  triggerEvent!: string | null;

  @Column({ type: "boolean", nullable: false, default: true, name: "enabled" })
  enabled!: boolean;

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
