import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";
import { User } from "../../../../src/identity/auth/entities/user.entity.js";
import { UserDao } from "../../../../src/identity/auth/daos/user.dao.js";
import { Branch } from "../../../../src/identity/branches/entities/branch.entity.js";
import { BranchDao } from "../../../../src/identity/branches/daos/branch.dao.js";
import { Plan } from "../../../../src/app_platform/billing/entities/plan.entity.js";
import { Subscription } from "../../../../src/app_platform/billing/entities/subscription.entity.js";
import { PlanDao } from "../../../../src/app_platform/billing/daos/plan.dao.js";
import { SubscriptionDao } from "../../../../src/app_platform/billing/daos/subscription.dao.js";
import {
  MissingSubscriptionError,
  PlanLimitService,
} from "../../../../src/app_platform/billing/services/plan-limit.service.js";
import { BillingService } from "../../../../src/app_platform/billing/services/billing.service.js";
import { PlanLimitReachedError } from "../../../../src/app_platform/billing/errors/plan-limit-reached.error.js";
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

// Integración contra Postgres real: el bloqueo de la suscripción solo se puede probar
// con transacciones de verdad.
describe("PlanLimitService", () => {
  const stamp = Date.now();
  let userDao: UserDao;
  let branchDao: BranchDao;
  let limits: PlanLimitService;
  let billing: BillingService;
  let seq = 0;

  async function tenantWithPlan(
    suffix: string,
    planKey: string,
    extras = { users: 0, branches: 0 },
  ) {
    const tenantId = `${stamp}${suffix}`;
    await setupStaff(AppDataSource, tenantId, ["owner"]);
    await AppDataSource.query(
      `INSERT INTO subscriptions (tenant_id, plan_id, extra_users, extra_branches)
       SELECT $1, id, $3, $4 FROM plans WHERE key = $2`,
      [tenantId, planKey, extras.users, extras.branches],
    );
    return tenantId;
  }

  const addUser = () =>
    userDao.create({
      firstName: "T",
      lastName: "U",
      email: `u${stamp}.${++seq}@test.local`,
      password: "x",
      role: "cashier",
    });
  const addBranch = () => branchDao.create({ name: `Sucursal ${++seq}`, isActive: true });

  beforeAll(async () => {
    await AppDataSource.initialize();
    userDao = new UserDao(AppDataSource.getRepository(User));
    branchDao = new BranchDao(AppDataSource.getRepository(Branch));
    const subscriptionDao = new SubscriptionDao(AppDataSource.getRepository(Subscription));
    limits = new PlanLimitService(subscriptionDao, userDao, branchDao);
    billing = new BillingService(
      new PlanDao(AppDataSource.getRepository(Plan)),
      subscriptionDao,
      limits,
    );
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("basico admite 3 usuarios activos y rechaza el cuarto con limit y used", async () => {
    const tenantId = await tenantWithPlan("91", "basico");
    await runWithTenant(tenantId, async () => {
      await limits.withCapacity("users", addUser);
      await limits.withCapacity("users", addUser);
      const error = await limits.withCapacity("users", addUser).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(PlanLimitReachedError);
      expect(error).toMatchObject({ resource: "users", limit: 3, used: 3 });
      expect(await userDao.countActive()).toBe(3);
    });
  });

  it("dos altas simultáneas por el último lugar: solo una entra", async () => {
    const tenantId = await tenantWithPlan("92", "basico");
    await runWithTenant(tenantId, async () => {
      await limits.withCapacity("users", addUser);
      const slowAdd = async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return addUser();
      };
      const results = await Promise.allSettled([
        limits.withCapacity("users", slowAdd),
        limits.withCapacity("users", slowAdd),
      ]);
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
      expect(rejected.reason).toBeInstanceOf(PlanLimitReachedError);
      expect(await userDao.countActive()).toBe(3);
    });
  });

  it("los extras suman al límite del plan", async () => {
    const tenantId = await tenantWithPlan("93", "basico", { users: 0, branches: 1 });
    await runWithTenant(tenantId, async () => {
      await limits.withCapacity("branches", addBranch);
      await expect(limits.withCapacity("branches", addBranch)).rejects.toMatchObject({
        resource: "branches",
        limit: 2,
        used: 2,
      });
    });
  });

  it("un usuario desactivado libera su lugar", async () => {
    const tenantId = await tenantWithPlan("94", "basico");
    await runWithTenant(tenantId, async () => {
      const second = await limits.withCapacity("users", addUser);
      await limits.withCapacity("users", addUser);
      await userDao.toggleStatus(second.id);
      await expect(limits.withCapacity("users", addUser)).resolves.toBeDefined();
    });
  });

  it("solo cuenta los usuarios del propio taller", async () => {
    const crowded = await tenantWithPlan("95", "cadena");
    await runWithTenant(crowded, async () => {
      for (let i = 0; i < 5; i++) await limits.withCapacity("users", addUser);
    });
    const small = await tenantWithPlan("96", "basico");
    await runWithTenant(small, async () => {
      expect(await limits.usage()).toEqual({ users: 1, branches: 1 });
      await expect(limits.withCapacity("users", addUser)).resolves.toBeDefined();
    });
  });

  it("el plan platform no tiene límite", async () => {
    const tenantId = await tenantWithPlan("97", "platform");
    await runWithTenant(tenantId, async () => {
      for (let i = 0; i < 4; i++) await limits.withCapacity("branches", addBranch);
      expect(await branchDao.countActive()).toBe(5);
    });
  });

  it("sin suscripción no deja dar de alta", async () => {
    const tenantId = `${stamp}98`;
    await setupStaff(AppDataSource, tenantId, ["owner"]);
    await runWithTenant(tenantId, async () => {
      await expect(limits.withCapacity("users", addUser)).rejects.toBeInstanceOf(
        MissingSubscriptionError,
      );
    });
  });

  it("si la operación falla, no queda nada dado de alta", async () => {
    const tenantId = await tenantWithPlan("99", "basico");
    await runWithTenant(tenantId, async () => {
      await expect(
        limits.withCapacity("users", async () => {
          await addUser();
          throw new Error("falla después del insert");
        }),
      ).rejects.toThrow("falla después del insert");
      expect(await userDao.countActive()).toBe(1);
    });
  });

  describe("BillingService.assign", () => {
    it("rechaza bajar a un plan donde el uso no cabe y acepta subir", async () => {
      const tenantId = await tenantWithPlan("90", "crecimiento");
      await runWithTenant(tenantId, async () => {
        for (let i = 0; i < 3; i++) await limits.withCapacity("users", addUser);
      });
      const [{ publicId }] = await AppDataSource.query(
        `SELECT public_id AS "publicId" FROM tenants WHERE id = $1`,
        [tenantId],
      );

      await expect(billing.assign(publicId, { planKey: "basico" })).rejects.toThrow(
        "4 usuarios activos",
      );
      await expect(
        billing.assign(publicId, { planKey: "basico", extraUsers: 1 }),
      ).resolves.toMatchObject({
        plan: { key: "basico" },
        limits: { users: 4, branches: 1 },
        usage: { users: 4, branches: 1 },
      });
      await expect(
        billing.assign(publicId, { planKey: "cadena", status: "active" }),
      ).resolves.toMatchObject({
        plan: { key: "cadena" },
        status: "active",
        limits: { users: 16, branches: 5 },
      });
    });

    it("un taller inexistente devuelve null", async () => {
      expect(
        await billing.assign("00000000-0000-0000-0000-000000000000", { planKey: "basico" }),
      ).toBeNull();
    });
  });
});
