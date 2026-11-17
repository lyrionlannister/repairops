import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, Unique } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Sale } from "../../inventory/entities/sale.entity.js";
import type { CashMovementMethod } from "../../cash/entities/cash-movement.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";

// FK real a Sale (db-schema-design item 4: destino unico y conocido). Sale
// nunca se borra (SPEC-pos-sale-cycle.md), asi que no hace falta onDelete.
@Entity("returns")
@Unique(["tenantId", "returnNumber"])
@Unique(["tenantId", "idempotencyKey"])
export class Return extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_returns_tenant" })
  tenant?: Tenant;

  @Column({ type: "bigint", nullable: false, name: "id_venta" })
  saleId!: string;

  @ManyToOne(() => Sale)
  @JoinColumn({ name: "id_venta" })
  sale?: Sale;

  // Folio propio (local_config.siguiente_numero_devolucion), mismo patron
  // atomico que Sale.saleNumber -- nunca comparte el consecutivo de venta.
  @Column({ type: "int", name: "numero_devolucion" })
  returnNumber!: number;

  // Sesion de caja ABIERTA al momento de la devolucion -- no necesariamente
  // la misma en la que se cobro la venta original (pudo cerrarse hace dias).
  @Column({ type: "bigint", nullable: false, name: "id_sesion_caja" })
  cashSessionId!: string;

  @Column({ type: "varchar", length: 20, nullable: false, name: "metodo_reembolso" })
  refundMethod!: CashMovementMethod;

  @Column({ type: "text", nullable: false, name: "motivo" })
  reason!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "monto_reembolsado" })
  totalRefunded!: number;

  @Column({ type: "bigint", nullable: true, name: "id_empleado_creador" })
  createdByEmployeeId!: string | null;

  // Mismo criterio que Sale.idempotencyKey: un doble clic en "Confirmar
  // devolucion" nunca produce una segunda Return.
  @Column({ type: "varchar", length: 100, nullable: true, name: "idempotency_key" })
  idempotencyKey!: string | null;

  @CreateDateColumn({ name: "fecha_creacion", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
