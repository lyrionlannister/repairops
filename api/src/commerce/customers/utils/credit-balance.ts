import { Decimal } from "decimal.js";
import type { EntityManager } from "typeorm";
import { Sale } from "../../inventory/entities/sale.entity.js";
import { SalePayment } from "../../payments/entities/sale-payment.entity.js";
import { RepairNote } from "../../repair-notes/entities/repair-note.entity.js";
import { RepairNotePayment } from "../../repair-notes/entities/repair-note-payment.entity.js";
import { CustomerPayment } from "../entities/customer-payment.entity.js";

// Saldo a crédito de un cliente: NUNCA cacheado. Es lo fiado (pagos "credito"
// de sus ventas y notas de reparación, en cualquier sucursal -- el crédito es
// del cliente, no de la sucursal) MENOS sus abonos. Un solo lugar para que la
// venta, la entrega de una nota, el registro de un abono y la ficha del
// cliente vean el mismo número. Nunca negativo (un cliente no "sobra" crédito
// por abonar de más; eso es un error de captura, no saldo a favor).
export async function sumCreditBalance(manager: EntityManager, tenantId: string, customerId: string): Promise<number> {
  const sales = await manager
    .createQueryBuilder(SalePayment, "payment")
    .innerJoin(Sale, "sale", "sale.id = payment.saleId AND sale.tenantId = :tenantId", { tenantId })
    .select("COALESCE(SUM(payment.amount), 0)", "total")
    .where("payment.tenantId = :tenantId", { tenantId })
    .andWhere("payment.method = 'credito'")
    .andWhere("sale.customerId = :customerId", { customerId })
    .getRawOne<{ total: string }>();

  const notes = await manager
    .createQueryBuilder(RepairNotePayment, "payment")
    .innerJoin(RepairNote, "note", "note.id = payment.repairNoteId AND note.tenantId = :tenantId", { tenantId })
    .select("COALESCE(SUM(payment.amount), 0)", "total")
    .where("payment.tenantId = :tenantId", { tenantId })
    .andWhere("payment.method = 'credito'")
    .andWhere("note.customerId = :customerId", { customerId })
    .getRawOne<{ total: string }>();

  const payments = await manager
    .createQueryBuilder(CustomerPayment, "payment")
    .select("COALESCE(SUM(payment.amount), 0)", "total")
    .where("payment.tenantId = :tenantId", { tenantId })
    .andWhere("payment.customerId = :customerId", { customerId })
    .getRawOne<{ total: string }>();

  const debt = new Decimal(sales?.total ?? 0).plus(notes?.total ?? 0);
  const balance = debt.minus(payments?.total ?? 0);
  return Decimal.max(0, balance).toNumber();
}

export interface CreditDebtRow {
  kind: "sale" | "repair_note";
  reference: number;
  date: string;
  amount: string;
}

// Cada pago a crédito, de venta o de nota, más reciente primero.
export async function listCreditDebts(manager: EntityManager, tenantId: string, customerId: string): Promise<CreditDebtRow[]> {
  const sales = await manager
    .createQueryBuilder(SalePayment, "payment")
    .innerJoin(Sale, "sale", "sale.id = payment.saleId AND sale.tenantId = :tenantId", { tenantId })
    .select("sale.saleNumber", "reference")
    .addSelect("sale.createdAt", "date")
    .addSelect("payment.amount", "amount")
    .where("payment.tenantId = :tenantId", { tenantId })
    .andWhere("payment.method = 'credito'")
    .andWhere("sale.customerId = :customerId", { customerId })
    .getRawMany<{ reference: string; date: Date; amount: string }>();

  const notes = await manager
    .createQueryBuilder(RepairNotePayment, "payment")
    .innerJoin(RepairNote, "note", "note.id = payment.repairNoteId AND note.tenantId = :tenantId", { tenantId })
    .select("note.controlNumber", "reference")
    .addSelect("payment.createdAt", "date")
    .addSelect("payment.amount", "amount")
    .where("payment.tenantId = :tenantId", { tenantId })
    .andWhere("payment.method = 'credito'")
    .andWhere("note.customerId = :customerId", { customerId })
    .getRawMany<{ reference: string; date: Date; amount: string }>();

  const rows: CreditDebtRow[] = [
    ...sales.map((r) => ({ kind: "sale" as const, reference: Number(r.reference), date: new Date(r.date).toISOString(), amount: r.amount })),
    ...notes.map((r) => ({ kind: "repair_note" as const, reference: Number(r.reference), date: new Date(r.date).toISOString(), amount: r.amount })),
  ];
  return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
}
