import { Entity, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { Branch } from "../../../identity/branches/entities/branch.entity.js";
import { Customer } from "./customer.entity.js";
import type { CashMovementMethod } from "../../cash/entities/cash-movement.entity.js";

// Abono a la deuda a crédito de un cliente. Fuente de verdad junto con los
// pagos "credito" de ventas/notas (ver utils/credit-balance.ts: el saldo es
// deudas menos abonos, un solo lugar). Cada fila también genera su
// CashMovement de ingreso en la caja abierta de localId -- la relación se
// resuelve por CashMovement.relatedEntityType = 'customer_payment' +
// relatedEntityId (mismo patrón ya usado para "repair_note"/"sale").
// metodo reutiliza CashMovementMethod (varchar + union de TS, mismo criterio
// que el resto del proyecto: sin tipo ENUM nativo, por consistencia).
@Entity("customer_payments")
@Index("IDX_customer_payments_tenant", ["tenantId"])
@Index("IDX_customer_payments_cliente", ["customerId"])
export class CustomerPayment extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_customer_payments_tenant" })
  tenant?: Tenant;

  // Sucursal cuya caja recibe el ingreso -- igual criterio que CashSession.
  @Column({ type: "bigint", nullable: false, name: "local_id" })
  localId!: string;

  @ManyToOne(() => Branch, { onDelete: "NO ACTION" })
  @JoinColumn({ name: "local_id", foreignKeyConstraintName: "FK_customer_payments_local" })
  branch?: Branch;

  @Column({ type: "bigint", nullable: false, name: "id_cliente" })
  customerId!: string;

  // No se borra un cliente con abonos registrados: es dinero ya cobrado, el
  // registro se audita (RESTRICT vía NO ACTION, igual criterio que sucursal).
  @ManyToOne(() => Customer, { onDelete: "NO ACTION" })
  @JoinColumn({ name: "id_cliente", foreignKeyConstraintName: "FK_customer_payments_id_cliente" })
  customer?: Customer;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false, name: "monto" })
  amount!: number;

  @Column({ type: "varchar", length: 20, nullable: false, name: "metodo" })
  method!: CashMovementMethod;

  @Column({ type: "bigint", nullable: true, name: "id_empleado" })
  createdByEmployeeId?: string | null;

  @CreateDateColumn({ name: "fecha_creacion", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
