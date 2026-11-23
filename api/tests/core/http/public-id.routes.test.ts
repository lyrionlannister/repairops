import "reflect-metadata";
import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../src/core/config/data-source.js";
import { Customer } from "../../../src/commerce/customers/entities/customer.entity.js";
import { CustomerPayment } from "../../../src/commerce/customers/entities/customer-payment.entity.js";
import { CustomerDao } from "../../../src/commerce/customers/daos/customer.dao.js";
import { CustomerPaymentDao } from "../../../src/commerce/customers/daos/customer-payment.dao.js";
import { CustomerService } from "../../../src/commerce/customers/services/customer.service.js";
import { CustomerDebtService } from "../../../src/commerce/customers/services/customer-debt.service.js";
import { CustomerPaymentService } from "../../../src/commerce/customers/services/customer-payment.service.js";
import { CustomerController } from "../../../src/commerce/customers/controllers/customer.controller.js";
import { createCustomerRouter } from "../../../src/commerce/customers/routes/customer.routes.js";
import { Quote } from "../../../src/commerce/quotes/entities/quote.entity.js";
import { RepairNote } from "../../../src/commerce/repair-notes/entities/repair-note.entity.js";
import { RepairNoteDao } from "../../../src/commerce/repair-notes/daos/repair-note.dao.js";
import { SalePayment } from "../../../src/commerce/payments/entities/sale-payment.entity.js";
import { SalePaymentDao } from "../../../src/commerce/payments/daos/sale-payment.dao.js";
import { BranchAccessService } from "../../../src/identity/branches/services/branch-access.service.js";
import { BranchDao } from "../../../src/identity/branches/daos/branch.dao.js";
import { Branch } from "../../../src/identity/branches/entities/branch.entity.js";
import { runWithTenant } from "../../../src/core/tenancy/tenant-context.js";
import { PublicIdLeakError, toPublicIds } from "../../../src/core/http/public-id/public-id-response.js";
import {
  PublicIdNotFoundError,
  resolveRequestPublicIds,
} from "../../../src/core/http/public-id/public-id-request.js";
import jwt from "jsonwebtoken";
import { requireJwtSecret } from "../../../src/identity/auth/jwt-secret.js";
import { User } from "../../../src/identity/auth/entities/user.entity.js";
import { setupStaff } from "../../support/staff.js";

const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// Integration test contra Postgres real + el router real: el id interno de un
// cliente nunca sale por la API ni se acepta como entrada, y un public_id de
// otro tenant responde igual que uno inexistente.
describe("public ids en la frontera HTTP (clientes)", () => {
  let app: express.Express;
  const base = Date.now();
  const tenantA = `${base}3`;
  const tenantB = `${base}4`;
  let ownerA = "";
  let ownerAId = "";
  let branchA = "";
  let customerA: Customer;
  let customerB: Customer;
  let controller: CustomerController;

  const createCustomer = (tenantId: string, name: string): Promise<Customer> =>
    AppDataSource.getRepository(Customer).save(
      AppDataSource.getRepository(Customer).create({ tenantId, name, phone: "5215500000000" }),
    );

  beforeAll(async () => {
    await AppDataSource.initialize();
    let tokens: Record<string, string>;
    let userIds: Record<string, string>;
    ({ tokens, branchId: branchA, userIds } = await setupStaff(AppDataSource, tenantA, ["owner"]));
    ownerA = tokens["owner"] ?? "";
    ownerAId = userIds["owner"] ?? "";
    await setupStaff(AppDataSource, tenantB, ["owner"]);
    customerA = await createCustomer(tenantA, "Cliente A");
    customerB = await createCustomer(tenantB, "Cliente B");

    const customerDao = new CustomerDao(AppDataSource.getRepository(Customer));
    controller = new CustomerController(
      new CustomerService(
        customerDao,
        new RepairNoteDao(AppDataSource.getRepository(RepairNote)),
        new SalePaymentDao(AppDataSource.getRepository(SalePayment)),
      ),
      new CustomerDebtService(customerDao),
      new CustomerPaymentService(
        new CustomerPaymentDao(AppDataSource.getRepository(CustomerPayment)),
      ),
      new BranchAccessService(new BranchDao(AppDataSource.getRepository(Branch))),
    );
    app = express();
    app.use(express.json());
    app.use("/customers", createCustomerRouter(controller));
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("un cliente nuevo recibe un public_id uuid v7", () => {
    expect(customerA.publicId).toMatch(UUID_V7);
  });

  it("el listado expone el public_id como id y nunca el id interno", async () => {
    const res = await request(app).get("/customers").set("Authorization", `Bearer ${ownerA}`);
    expect(res.status).toBe(200);
    const listed = (res.body as Array<Record<string, unknown>>).find(
      (c) => c["name"] === "Cliente A",
    );
    expect(listed?.["id"]).toBe(customerA.publicId);
    expect(listed).not.toHaveProperty("publicId");
    expect(JSON.stringify(res.body)).not.toContain(`"id":"${customerA.id}"`);
  });

  it("resuelve /:id por public_id y rechaza el id interno con 404", async () => {
    const byPublic = await request(app)
      .get(`/customers/${customerA.publicId}`)
      .set("Authorization", `Bearer ${ownerA}`);
    expect(byPublic.status).toBe(200);
    expect(byPublic.body.id).toBe(customerA.publicId);

    const byInternal = await request(app)
      .get(`/customers/${customerA.id}`)
      .set("Authorization", `Bearer ${ownerA}`);
    expect(byInternal.status).toBe(404);
    expect(JSON.stringify(byInternal.body)).not.toContain("Cliente A");
  });

  it("un segmento que no es uuid deja pasar a la siguiente ruta y no se traduce dos veces", async () => {
    const nested = express();
    nested.use(express.json());
    nested.use("/customers", createCustomerRouter(controller));
    nested.use("/customers/extra", createCustomerRouter(controller));
    // "/customers/extra" cae primero en /customers/:id ("extra" no es uuid) y luego en el
    // segundo router, que vuelve a correr tenantMiddleware sobre el query ya traducido.
    const res = await request(nested)
      .get(`/customers/extra?customerId=${customerA.publicId}`)
      .set("Authorization", `Bearer ${ownerA}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("un public_id de otro tenant responde el mismo 404 que uno inexistente", async () => {
    const foreign = await request(app)
      .get(`/customers/${customerB.publicId}`)
      .set("Authorization", `Bearer ${ownerA}`);
    const missing = await request(app)
      .get("/customers/00000000-0000-7000-8000-000000000000")
      .set("Authorization", `Bearer ${ownerA}`);
    expect(foreign.status).toBe(404);
    expect(foreign.body).toEqual(missing.body);

    const patch = await request(app)
      .patch(`/customers/${customerB.publicId}`)
      .set("Authorization", `Bearer ${ownerA}`)
      .send({ name: "Hackeado" });
    expect(patch.status).toBe(404);
    const untouched = await AppDataSource.getRepository(Customer).findOneByOrFail({
      id: customerB.id,
    });
    expect(untouched.name).toBe("Cliente B");
  });

  it("traduce el customerId del body a id interno solo dentro del tenant", async () => {
    const body = { customerId: customerA.publicId };
    await runWithTenant(tenantA, () => resolveRequestPublicIds({ body, query: {} }));
    expect(body.customerId).toBe(customerA.id);

    for (const customerId of [customerB.publicId, customerA.id, Number(customerA.id)]) {
      await expect(
        runWithTenant(tenantA, () => resolveRequestPublicIds({ body: { customerId }, query: {} })),
      ).rejects.toBeInstanceOf(PublicIdNotFoundError);
    }
  });

  it("traduce las FKs a clientes en entidades y en objetos planos", async () => {
    const payment = AppDataSource.getRepository(CustomerPayment).create({
      tenantId: tenantA,
      localId: branchA,
      customerId: customerA.id,
      amount: "10.00",
      method: "efectivo",
    });
    const quote = AppDataSource.getRepository(Quote).create({ tenantId: tenantA, customerId: customerA.id });
    const output = (await toPublicIds({ payment, quote, rows: [{ customerId: customerA.id }] })) as {
      payment: Record<string, unknown>;
      quote: Record<string, unknown>;
      rows: Array<Record<string, unknown>>;
    };
    expect(output.payment["customerId"]).toBe(customerA.publicId);
    const branch = await AppDataSource.getRepository(Branch).findOneByOrFail({ id: branchA });
    expect(output.payment["localId"]).toBe(branch.publicId);
    expect(output.quote["customerId"]).toBe(customerA.publicId);
    expect(output.rows[0]?.["customerId"]).toBe(customerA.publicId);
  });

  it("un JWT con el id interno del usuario ya no autentica", async () => {
    const legacy = jwt.sign({ id: ownerAId, email: "x", tenantId: tenantA }, requireJwtSecret());
    const legacyTenantOnly = jwt.sign({ id: customerA.publicId, email: "x", tenantId: tenantA }, requireJwtSecret());
    for (const token of [legacy, legacyTenantOnly]) {
      const res = await request(app).get("/customers").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(401);
    }
  });

  it("traduce usuarios: filas copiadas con spread y FKs de empleado sin constraint", async () => {
    const owner = await AppDataSource.getRepository(User).findOneByOrFail({ id: ownerAId });
    const { password: _password, ...session } = owner;
    const payment = AppDataSource.getRepository(CustomerPayment).create({
      tenantId: tenantA,
      customerId: customerA.id,
      createdByEmployeeId: ownerAId,
    });
    const output = (await toPublicIds({
      user: { ...session, roles: ["owner"] },
      payment,
      report: [{ employeeId: ownerAId }],
    })) as { user: Record<string, unknown>; payment: Record<string, unknown>; report: Array<Record<string, unknown>> };
    expect(output.user["id"]).toBe(owner.publicId);
    expect(output.user).not.toHaveProperty("publicId");
    expect(output.payment["createdByEmployeeId"]).toBe(owner.publicId);
    expect(output.report[0]?.["employeeId"]).toBe(owner.publicId);

    const body = { createdByEmployeeId: owner.publicId };
    await runWithTenant(tenantA, () => resolveRequestPublicIds({ body, query: {} }));
    expect(body.createdByEmployeeId).toBe(ownerAId);
  });

  it("una respuesta con un id interno sin traducir no sale", async () => {
    await expect(toPublicIds([{ id: customerA.id, name: "fila cruda sin publicId" }])).rejects.toBeInstanceOf(
      PublicIdLeakError,
    );
    await expect(toPublicIds({ rows: [{ unknownRefId: "7" }] })).rejects.toBeInstanceOf(PublicIdLeakError);
  });

  it("traduce referencias polimorficas segun su discriminador y arrays de ids", async () => {
    const [{ id: serviceTypeId, publicId: serviceTypePublicId }] = await AppDataSource.query<
      Array<{ id: string; publicId: string }>
    >(
      `INSERT INTO service_types (tenant_id, nombre) VALUES ($1, 'Servicio poly') RETURNING id::text AS id, public_id::text AS "publicId"`,
      [tenantA],
    );
    const output = (await toPublicIds({
      line: { lineType: "service_type", referenceId: serviceTypeId },
      serviceTypeIds: [serviceTypeId],
    })) as { line: Record<string, unknown>; serviceTypeIds: string[] };
    expect(output.line["referenceId"]).toBe(serviceTypePublicId);
    expect(output.serviceTypeIds).toEqual([serviceTypePublicId]);

    const body = { items: [{ lineType: "service_type", referenceId: serviceTypePublicId }], serviceTypeIds: [serviceTypePublicId] };
    await runWithTenant(tenantA, () => resolveRequestPublicIds({ body, query: {} }));
    expect(body.items[0]?.referenceId).toBe(serviceTypeId);
    expect(body.serviceTypeIds).toEqual([serviceTypeId]);
  });

  it("traducir dos veces no cambia el resultado", async () => {
    const once = await toPublicIds({ customerId: customerA.id });
    expect(await toPublicIds(once)).toEqual(once);
  });
});
