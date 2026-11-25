import "reflect-metadata";
import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { User } from "../../../../src/identity/auth/entities/user.entity.js";
import { UserDao } from "../../../../src/identity/auth/daos/user.dao.js";
import { Branch } from "../../../../src/identity/branches/entities/branch.entity.js";
import { BranchDao } from "../../../../src/identity/branches/daos/branch.dao.js";
import { BranchService } from "../../../../src/identity/branches/services/branch.service.js";
import { BranchController } from "../../../../src/identity/branches/controllers/branch.controller.js";
import { createBranchRouter } from "../../../../src/identity/branches/routes/branch.routes.js";
import { Plan } from "../../../../src/app_platform/billing/entities/plan.entity.js";
import { Subscription } from "../../../../src/app_platform/billing/entities/subscription.entity.js";
import { PlanDao } from "../../../../src/app_platform/billing/daos/plan.dao.js";
import { SubscriptionDao } from "../../../../src/app_platform/billing/daos/subscription.dao.js";
import { PlanLimitService } from "../../../../src/app_platform/billing/services/plan-limit.service.js";
import { BillingService } from "../../../../src/app_platform/billing/services/billing.service.js";
import { BillingController } from "../../../../src/app_platform/billing/controllers/billing.controller.js";
import {
  createBillingRouter,
  createPlatformBillingRouter,
} from "../../../../src/app_platform/billing/routes/billing.routes.js";
import { setupStaff } from "../../../support/staff.js";

// Mock compartido de Stripe (tests/support/stripe-client.mock.ts): con
// pool vmThreads el servicio queda ligado a la instancia del primer
// archivo que lo importa; si cada archivo usa su propia factoría, los
// demás afirman sobre otra instancia (0 llamadas) o sobre el cliente
// real ("Falta STRIPE_PRIVATE_KEY") solo en la suite completa.
vi.mock(
  "../../../../src/app_platform/billing/clients/stripe.client.js",
  async () => (await import("../../../support/stripe-client.mock.js")).stripeClientMock,
);
vi.mock(
  "../../../../src/identity/auth/clients/resend.client.js",
  async () => (await import("../../../support/resend-client.mock.js")).resendClientMock,
);

describe("billing routes", () => {
  let app: express.Express;
  const tenantId = `${Date.now()}61`;
  const adminTenantId = `${Date.now()}62`;
  let tokens: Record<string, string> = {};
  let adminToken = "";
  let tenantPublicId = "";

  beforeAll(async () => {
    await AppDataSource.initialize();
    ({ tokens } = await setupStaff(AppDataSource, tenantId, ["owner", "cashier"]));
    await AppDataSource.query(
      `INSERT INTO subscriptions (tenant_id, plan_id) SELECT $1, id FROM plans WHERE key = 'basico'`,
      [tenantId],
    );
    const admin = await setupStaff(AppDataSource, adminTenantId, ["owner"]);
    await AppDataSource.query(`UPDATE usuarios SET es_platform_admin = true WHERE id = $1`, [
      admin.userIds["owner"],
    ]);
    await AppDataSource.query(
      `INSERT INTO subscriptions (tenant_id, plan_id, status) SELECT $1, id, 'active' FROM plans WHERE key = 'platform'`,
      [adminTenantId],
    );
    adminToken = admin.tokens["owner"];
    [{ publicId: tenantPublicId }] = await AppDataSource.query(
      `SELECT public_id AS "publicId" FROM tenants WHERE id = $1`,
      [tenantId],
    );

    const userDao = new UserDao(AppDataSource.getRepository(User));
    const branchDao = new BranchDao(AppDataSource.getRepository(Branch));
    const subscriptionDao = new SubscriptionDao(AppDataSource.getRepository(Subscription));
    const limits = new PlanLimitService(subscriptionDao, userDao, branchDao);
    const billingController = new BillingController(
      new BillingService(new PlanDao(AppDataSource.getRepository(Plan)), subscriptionDao, limits),
    );

    app = express();
    app.use(express.json());
    app.use("/billing", createBillingRouter(billingController));
    app.use("/platform", createPlatformBillingRouter(billingController));
    app.use(
      "/branches",
      createBranchRouter(new BranchController(new BranchService(branchDao, limits))),
    );
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("el dueño ve su plan, sus límites y su uso", async () => {
    const res = await request(app)
      .get("/billing/plan")
      .set("Authorization", `Bearer ${tokens["owner"]}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      plan: { key: "basico", maxUsers: 3, maxBranches: 1 },
      status: "trialing",
      limits: { users: 3, branches: 1 },
      usage: { users: 2, branches: 1 },
    });
  });

  it("el cajero no ve el plan (403)", async () => {
    const res = await request(app)
      .get("/billing/plan")
      .set("Authorization", `Bearer ${tokens["cashier"]}`);
    expect(res.status).toBe(403);
  });

  it("crear una sucursal por encima del plan responde 402 con código fijo", async () => {
    const res = await request(app)
      .post("/branches")
      .set("Authorization", `Bearer ${tokens["owner"]}`)
      .send({ name: "Segunda sucursal" });
    expect(res.status).toBe(402);
    expect(res.body).toMatchObject({
      code: "plan_limit_reached",
      resource: "branches",
      limit: 1,
      used: 1,
    });
  });

  it("las rutas de plataforma rechazan al dueño de un taller (403)", async () => {
    for (const path of ["/platform/plans", "/platform/tenants"]) {
      const res = await request(app).get(path).set("Authorization", `Bearer ${tokens["owner"]}`);
      expect(res.status).toBe(403);
    }
    const res = await request(app)
      .patch(`/platform/tenants/${tenantPublicId}/subscription`)
      .set("Authorization", `Bearer ${tokens["owner"]}`)
      .send({ planKey: "cadena" });
    expect(res.status).toBe(403);
  });

  it("el admin de plataforma lista planes y talleres", async () => {
    const plans = await request(app)
      .get("/platform/plans")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(plans.status).toBe(200);
    expect(plans.body.map((plan: Plan) => [plan.key, plan.maxUsers, plan.maxBranches])).toEqual([
      ["basico", 3, 1],
      ["crecimiento", 8, 3],
      ["cadena", 15, 5],
      ["platform", null, null],
    ]);

    const tenants = await request(app)
      .get("/platform/tenants")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(tenants.status).toBe(200);
    expect(tenants.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tenantId: tenantPublicId, usage: { users: 2, branches: 1 } }),
      ]),
    );
  });

  it("el admin agrega una sucursal extra y entonces el dueño ya puede crearla", async () => {
    const assign = await request(app)
      .patch(`/platform/tenants/${tenantPublicId}/subscription`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ planKey: "basico", extraBranches: 1 });
    expect(assign.status).toBe(200);
    expect(assign.body.limits).toEqual({ users: 3, branches: 2 });

    const created = await request(app)
      .post("/branches")
      .set("Authorization", `Bearer ${tokens["owner"]}`)
      .send({ name: "Segunda sucursal" });
    expect(created.status).toBe(201);
  });

  it("valida el cuerpo y responde 404 para un taller inexistente", async () => {
    const invalid = await request(app)
      .patch(`/platform/tenants/${tenantPublicId}/subscription`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ planKey: "gratis", extraUsers: -1 });
    expect(invalid.status).toBe(400);

    const missing = await request(app)
      .patch("/platform/tenants/00000000-0000-0000-0000-000000000000/subscription")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ planKey: "basico" });
    expect(missing.status).toBe(404);
  });
});
