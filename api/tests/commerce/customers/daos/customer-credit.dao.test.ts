import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { Customer } from "../../../../src/commerce/customers/entities/customer.entity.js";
import { CustomerCreditDao } from "../../../../src/commerce/customers/daos/customer-credit.dao.js";
import { Tenant } from "../../../../src/core/tenancy/entities/tenant.entity.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

const TODAY = "2026-06-15";

describe("CustomerCreditDao", () => {
  let dao: CustomerCreditDao;
  let tenantA: string;
  let tenantB: string;
  let branchA: string;
  let branchB: string;
  let late: string;
  let current: string;
  let settled: string;
  let foreign: string;
  let saleNumber = 0;

  const run = <T = Array<{ id: string }>>(sql: string, params: unknown[] = []) =>
    AppDataSource.query<T>(sql, params);

  const insertId = async (sql: string, params: unknown[]): Promise<string> =>
    (await run(sql, params))[0].id;

  const addBranch = (tenantId: string) =>
    insertId(
      `INSERT INTO branches (tenant_id, nombre) VALUES ($1, 'Matriz') RETURNING id::text AS id`,
      [tenantId],
    );

  const addCustomer = (tenantId: string, name: string) =>
    insertId(`INSERT INTO customers (tenant_id, nombre) VALUES ($1, $2) RETURNING id::text AS id`, [
      tenantId,
      name,
    ]);

  const addCreditSale = async (
    tenantId: string,
    branchId: string,
    customerId: string,
    amount: string,
    dueDate: string,
  ) => {
    saleNumber += 1;
    const saleId = await insertId(
      `INSERT INTO sales (tenant_id, local_id, id_sesion_caja, numero_venta, subtotal, valor_total, customer_id)
       VALUES ($1, $2, 0, $3, $4, $4, $5) RETURNING id::text AS id`,
      [tenantId, branchId, saleNumber, amount, customerId],
    );
    await run(
      `INSERT INTO sale_payments (tenant_id, id_venta, metodo, monto, fecha_vencimiento) VALUES ($1, $2, 'credito', $3, $4)`,
      [tenantId, saleId, amount, dueDate],
    );
  };

  const addPayment = (tenantId: string, branchId: string, customerId: string, amount: string) =>
    run(
      `INSERT INTO customer_payments (tenant_id, local_id, id_cliente, monto, metodo) VALUES ($1, $2, $3, $4, 'efectivo')`,
      [tenantId, branchId, customerId, amount],
    );

  beforeAll(async () => {
    await AppDataSource.initialize();
    dao = new CustomerCreditDao(AppDataSource.getRepository(Customer));
    const tenants = AppDataSource.getRepository(Tenant);
    tenantA = (await tenants.save(tenants.create({ name: "credit-aging-a" }))).id;
    tenantB = (await tenants.save(tenants.create({ name: "credit-aging-b" }))).id;
    branchA = await addBranch(tenantA);
    branchB = await addBranch(tenantB);

    late = await addCustomer(tenantA, "Moroso");
    await addCreditSale(tenantA, branchA, late, "100.10", "2026-06-01");
    await addCreditSale(tenantA, branchA, late, "200.20", "2026-06-10");
    await addCreditSale(tenantA, branchA, late, "50.00", "2026-07-01");
    await addPayment(tenantA, branchA, late, "150.00");

    current = await addCustomer(tenantA, "Al corriente");
    await addCreditSale(tenantA, branchA, current, "80.00", "2026-06-15");

    settled = await addCustomer(tenantA, "Liquidado");
    await addCreditSale(tenantA, branchA, settled, "40.00", "2026-05-01");
    await addPayment(tenantA, branchA, settled, "40.00");

    foreign = await addCustomer(tenantB, "Otro tenant");
    await addCreditSale(tenantB, branchB, foreign, "999.00", "2026-01-01");
  });

  afterAll(async () => {
    const ids = [[tenantA, tenantB]];
    for (const table of ["customer_payments", "sale_payments", "sales", "customers", "branches"]) {
      await run(`DELETE FROM ${table} WHERE tenant_id = ANY($1::bigint[])`, ids);
    }
    await AppDataSource.getRepository(Tenant).delete([tenantA, tenantB]);
    await AppDataSource.destroy();
  });

  it("aplica los abonos a la deuda que vence primero y separa la mora", async () => {
    const rows = await runWithTenant(tenantA, () => dao.findAging(TODAY));
    const byCustomer = new Map(rows.map((r) => [r.customerId, r]));

    expect(byCustomer.get(late)).toEqual({
      customerId: late,
      balance: "200.30",
      overdue: "150.30",
    });
    expect(byCustomer.get(current)).toEqual({
      customerId: current,
      balance: "80.00",
      overdue: "0.00",
    });
  });

  it("omite clientes sin saldo pendiente", async () => {
    const rows = await runWithTenant(tenantA, () => dao.findAging(TODAY));
    expect(rows.map((r) => r.customerId)).not.toContain(settled);
  });

  it("nunca mezcla deudas de otro tenant, ni pidiendo sus clientes por id", async () => {
    const all = await runWithTenant(tenantA, () => dao.findAging(TODAY));
    const asked = await runWithTenant(tenantA, () => dao.findAging(TODAY, [foreign, late]));
    const own = await runWithTenant(tenantB, () => dao.findAging(TODAY));

    expect(all.map((r) => r.customerId)).not.toContain(foreign);
    expect(asked.map((r) => r.customerId)).toEqual([late]);
    expect(own).toEqual([{ customerId: foreign, balance: "999.00", overdue: "999.00" }]);
  });
});
