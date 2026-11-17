import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { Sale } from "../../inventory/entities/sale.entity.js";

export type SalePaymentMethod = "efectivo" | "tarjeta" | "transferencia" | "credito";

// Fuente de verdad del metodo de pago de una venta -- Sale nunca tiene
// columna paymentMethod (ver SPEC-pos-sale-cycle.md, seccion "Pago"). Fase 2
// siempre inserta exactamente una fila por venta; Fase 3 relaja eso a N
// filas cuya suma es el total (pago dividido) y empieza a llenar los
// campos de proveedor.
@Entity("sale_payments")
@Index("IDX_sale_payments_tenant", ["tenantId"])
@Index("IDX_sale_payments_id_venta", ["saleId"])
export class SalePayment extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_sale_payments_tenant" })
  tenant?: Tenant;

  @Column({ type: "bigint", nullable: false, name: "id_venta" })
  saleId!: string;

  @ManyToOne(() => Sale, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_venta", foreignKeyConstraintName: "FK_sale_payments_id_venta" })
  sale?: Sale;

  @Column({ type: "varchar", length: 20, nullable: false, name: "metodo" })
  method!: SalePaymentMethod;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false, name: "monto" })
  amount!: number;

  // Sin uso hasta Fase 3: tarjeta en mostrador se captura a mano de lo que
  // muestra el terminal fisico externo, no hay llamada a ningun proveedor
  // de pago en el POS (Stripe es solo la suscripcion SaaS, Fase 6).
  @Column({ type: "varchar", length: 255, nullable: true, name: "referencia_proveedor" })
  providerReference!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true, name: "codigo_autorizacion_proveedor" })
  providerAuthorizationCode!: string | null;
}
