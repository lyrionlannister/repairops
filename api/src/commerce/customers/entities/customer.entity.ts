import { Entity, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";

@Entity("customers")
export class Customer extends BaseEntity {
  @Column({ type: "bigint", nullable: false, name: "tenant_id" })
  tenantId!: string;

  @Column({ type: "varchar", length: 255, nullable: false, name: "nombre" })
  name!: string;

  @Column({ type: "varchar", length: 50, nullable: false, name: "telefono" })
  phone!: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "email" })
  email?: string | null;

  // Tope de venta a credito (Fase 5, Rama Cliente). El saldo actual NUNCA se
  // cachea aqui -- se calcula sumando SalePayment.amount con method='credito'
  // de las ventas de este cliente (ver SalePaymentDao.sumCreditoForCustomer).
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0, name: "limite_credito" })
  creditLimit!: number;

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
