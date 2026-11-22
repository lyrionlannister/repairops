import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { Customer } from "../../../../src/commerce/customers/entities/customer.entity.js";
import { CustomerPayment } from "../../../../src/commerce/customers/entities/customer-payment.entity.js";
import { CustomerPaymentDao } from "../../../../src/commerce/customers/daos/customer-payment.dao.js";
import { CustomerPaymentService } from "../../../../src/commerce/customers/services/customer-payment.service.js";
import { sumCreditBalance } from "../../../../src/commerce/customers/utils/credit-balance.js";
import { Sale } from "../../../../src/commerce/inventory/entities/sale.entity.js";
import { SalePayment } from "../../../../src/commerce/payments/entities/sale-payment.entity.js";
import { CashSession } from "../../../../src/commerce/cash/entities/cash-session.entity.js";
import { CashMovement } from "../../../../src/commerce/cash/entities/cash-movement.entity.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

// Abonos a credito: integration test contra Postgres real (igual criterio
// que repair-note.service.test.ts) -- el saldo (sumCreditBalance) y el
// movimiento de caja son el comportamiento real que importa, no algo que
// un mock pueda probar honestamente.
describe("CustomerPaymentService", () => {
  let service: CustomerPaymentService;
  const tenantId = `${Date.now()}8`;

  beforeAll(async () => {
    await AppDataSource.initialize();
    service = new CustomerPaymentService(new CustomerPaymentDao(AppDataSource.getRepository(CustomerPayment)));
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  // Crea un cliente que ya debe `debt` por una venta a credito -- mismo
  // mecanismo que usan las ventas y notas reales (SalePayment method='credito').
  const customerWithDebt = async (debt: number, creditLimit: number) => {
    const customer = await AppDataSource.getRepository(Customer).save({
      tenantId,
      name: `Cliente ${Date.now()}`,
      phone: `833${Math.floor(Math.random() * 10000000)}`,
      creditLimit: String(creditLimit),
    });
    const sale = await AppDataSource.getRepository(Sale).save({
      tenantId,
      localId: "6",
      saleNumber: Math.floor(Math.random() * 1000000),
      customerId: customer.id,
      customerName: customer.name,
      cashSessionId: "1",
      origin: "counter",
      subtotal: String(debt),
      totalValue: String(debt),
      createdByEmployeeId: null,
      idempotencyKey: null,
    });
    await AppDataSource.getRepository(SalePayment).save({ tenantId, saleId: sale.id, method: "credito", amount: String(debt) });
    return customer;
  };

  it("rejects a payment without an open cash session for the branch", async () => {
    const customer = await customerWithDebt(300, 1000);
    await expect(
      runWithTenant(tenantId, () =>
        service.register({ customerId: customer.id, localId: "9001", amount: 100, method: "efectivo", createdByEmployeeId: "1" }),
      ),
    ).rejects.toThrow("Abre la caja");
  });

  it("rejects a payment larger than what the customer owes", async () => {
    const localId = "9002";
    await AppDataSource.getRepository(CashSession).save({ tenantId, localId, openingBalance: "0", status: "open" });
    const customer = await customerWithDebt(100, 1000);

    await expect(
      runWithTenant(tenantId, () =>
        service.register({ customerId: customer.id, localId, amount: 150, method: "efectivo", createdByEmployeeId: "1" }),
      ),
    ).rejects.toThrow("no puede ser mayor a lo que debe");
  });

  it("registering a payment lowers the balance and logs a cash movement 'Abono cliente #N'", async () => {
    const localId = "42";
    await AppDataSource.getRepository(CashSession).save({ tenantId, localId, openingBalance: "0", status: "open" });
    const customer = await customerWithDebt(500, 1000);

    const before = await runWithTenant(tenantId, () => sumCreditBalance(AppDataSource.manager, tenantId, customer.id));
    expect(before).toBe("500.00");

    const payment = await runWithTenant(tenantId, () =>
      service.register({ customerId: customer.id, localId, amount: 200, method: "efectivo", createdByEmployeeId: "1" }),
    );
    expect(Number(payment.amount)).toBe(200);

    const after = await runWithTenant(tenantId, () => sumCreditBalance(AppDataSource.manager, tenantId, customer.id));
    expect(after).toBe("300.00");

    const history = await runWithTenant(tenantId, () => service.getByCustomerId(customer.id));
    expect(history).toHaveLength(1);

    const session = await AppDataSource.getRepository(CashSession).findOneBy({ tenantId, localId });
    const movements = await AppDataSource.getRepository(CashMovement).find({ where: { tenantId, cashSessionId: session!.id } });
    const abonoMovement = movements.find((m) => m.note === `Abono cliente #${customer.id}`);
    expect(abonoMovement).toBeTruthy();
    expect(Number(abonoMovement!.amount)).toBe(200);
    expect(abonoMovement!.relatedEntityType).toBe("customer_payment");
  });

  it("never lets the balance go negative even if payments summed more than the debt (defense in depth)", async () => {
    const localId = "9001";
    await AppDataSource.getRepository(CashSession).save({ tenantId, localId, openingBalance: "0", status: "open" });
    const customer = await customerWithDebt(100, 1000);

    await runWithTenant(tenantId, () =>
      service.register({ customerId: customer.id, localId, amount: 100, method: "efectivo", createdByEmployeeId: "1" }),
    );
    const balance = await runWithTenant(tenantId, () => sumCreditBalance(AppDataSource.manager, tenantId, customer.id));
    expect(balance).toBe("0.00");
  });
});
