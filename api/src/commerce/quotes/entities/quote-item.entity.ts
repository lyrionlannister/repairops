import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { Quote } from "./quote.entity.js";

@Entity("quote_items")
@Index("IDX_quote_items_tenant", ["tenantId"])
@Index("IDX_quote_items_id_cotizacion", ["quoteId"])
export class QuoteItem extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_quote_items_tenant" })
  tenant?: Tenant;

  @Column({ type: "bigint", nullable: false, name: "id_cotizacion" })
  quoteId!: string;

  @ManyToOne(() => Quote, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_cotizacion", foreignKeyConstraintName: "FK_quote_items_id_cotizacion" })
  quote?: Quote;

  @Column({ type: "bigint", nullable: true, name: "id_item_inventario" })
  inventoryItemId?: string | null;

  @Column({ type: "varchar", length: 255, nullable: false, name: "descripcion" })
  description!: string;

  @Column({ type: "int", nullable: false, name: "cantidad" })
  quantity!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "precio_unitario" })
  unitPrice!: string;
}
