import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { Quote } from "./quote.entity.js";
import { ServiceType } from "../../service-types/entities/service-type.entity.js";

// Tipos de servicio de una cotización de reparación; pasan tal cual a la nota al aceptarla.
@Entity("quote_service_types")
@Index("IDX_quote_service_types_tenant", ["tenantId"])
@Index("IDX_quote_service_types_id_cotizacion", ["quoteId"])
@Index("IDX_quote_service_types_id_tipo_servicio", ["serviceTypeId"])
export class QuoteServiceType extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_quote_service_types_tenant" })
  tenant?: Tenant;

  @Column({ type: "bigint", nullable: false, name: "id_cotizacion" })
  quoteId!: string;

  @ManyToOne(() => Quote, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_cotizacion", foreignKeyConstraintName: "FK_quote_service_types_id_cotizacion" })
  quote?: Quote;

  @Column({ type: "bigint", nullable: false, name: "id_tipo_servicio" })
  serviceTypeId!: string;

  @ManyToOne(() => ServiceType, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_tipo_servicio", foreignKeyConstraintName: "FK_quote_service_types_id_tipo_servicio" })
  serviceType?: ServiceType;
}
