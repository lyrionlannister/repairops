import { Entity, Column } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";

export type SalePaymentMethod = "efectivo" | "tarjeta" | "transferencia" | "credito";

// Fuente de verdad del metodo de pago de una venta -- Sale nunca tiene
// columna paymentMethod (ver SPEC-pos-sale-cycle.md, seccion "Pago"). Fase 2
// siempre inserta exactamente una fila por venta; Fase 3 relaja eso a N
// filas cuya suma es el total (pago dividido) y empieza a llenar los
// campos de proveedor.
@Entity("sale_payments")
export class SalePayment extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @Column({ type: "bigint", nullable: false, name: "id_venta" })
  saleId!: string;

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
