import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";
import { Tenant } from "../../../../src/core/tenancy/entities/tenant.entity.js";
import { User } from "../../../../src/identity/auth/entities/user.entity.js";
import { UserDao } from "../../../../src/identity/auth/daos/user.dao.js";
import {
  AuthService,
  UserRoleRuleError,
} from "../../../../src/identity/auth/services/auth.service.js";
import { Branch } from "../../../../src/identity/branches/entities/branch.entity.js";
import { BranchDao } from "../../../../src/identity/branches/daos/branch.dao.js";
import { UserBranch } from "../../../../src/identity/branches/entities/user-branch.entity.js";
import { UserBranchDao } from "../../../../src/identity/branches/daos/user-branch.dao.js";
import { UserBranchService } from "../../../../src/identity/branches/services/user-branch.service.js";
import { Subscription } from "../../../../src/app_platform/billing/entities/subscription.entity.js";
import { SubscriptionDao } from "../../../../src/app_platform/billing/daos/subscription.dao.js";
import { StripePrice } from "../../../../src/app_platform/billing/entities/stripe-price.entity.js";
import { StripePriceDao } from "../../../../src/app_platform/billing/daos/stripe-price.dao.js";
import { PlanLimitService } from "../../../../src/app_platform/billing/services/plan-limit.service.js";
import type { BillingService } from "../../../../src/app_platform/billing/services/billing.service.js";
import type { ServiceTypeService } from "../../../../src/commerce/service-types/services/service-type.service.js";
import type { BranchService } from "../../../../src/identity/branches/services/branch.service.js";
import { makeUserRoleDao } from "../../../support/authz-deps.js";
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

// Integración contra Postgres real: las reglas de roles corren en transacción.
describe("reglas de roles de usuario", () => {
  const tenantId = `${Date.now()}31`;
  const otherTenantId = `${Date.now()}32`;
  let service: AuthService;
  let ownerId = "";
  let cashierId = "";
  let branchId = "";
  let foreignOwnerId = "";
  let roleDao: ReturnType<typeof makeUserRoleDao>;

  beforeAll(async () => {
    await AppDataSource.initialize();
    roleDao = makeUserRoleDao();
    const staff = await setupStaff(AppDataSource, tenantId, ["owner", "cashier"]);
    ({ branchId } = staff);
    ownerId = staff.userIds["owner"];
    cashierId = staff.userIds["cashier"];
    foreignOwnerId = (await setupStaff(AppDataSource, otherTenantId, ["owner"])).userIds["owner"];
    await AppDataSource.query(
      `INSERT INTO subscriptions (tenant_id, plan_id) SELECT $1, id FROM plans WHERE key = 'platform'`,
      [tenantId],
    );

    const userDao = new UserDao(AppDataSource.getRepository(User));
    const branchDao = new BranchDao(AppDataSource.getRepository(Branch));
    const subscriptionDao = new SubscriptionDao(AppDataSource.getRepository(Subscription));
    service = new AuthService(
      userDao,
      AppDataSource.getRepository(Tenant),
      {} as ServiceTypeService,
      {} as BranchService,
      new UserBranchService(new UserBranchDao(AppDataSource.getRepository(UserBranch)), branchDao),
      {} as BillingService,
      new PlanLimitService(subscriptionDao, userDao, branchDao),
      new StripePriceDao(AppDataSource.getRepository(StripePrice)),
      subscriptionDao,
      roleDao,
    );
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  const inTenant = <T>(fn: () => Promise<T>) => runWithTenant(tenantId, fn);
  const employeeData = (email: string, roles: string[]) => ({
    firstName: "Ana",
    lastName: "Pérez",
    email,
    password: "password123",
    roles: roles as never,
    branchIds: [branchId],
  });

  it("un usuario puede tener varios roles y los guarda todos", async () => {
    const created = await inTenant(() =>
      service.createEmployee(
        employeeData(`multi.${tenantId}@test.local`, ["cashier", "technician"]),
      ),
    );
    expect(created.roles).toEqual(["cashier", "technician"]);
    expect(await inTenant(() => roleDao.findRolesOf(created.id))).toEqual([
      "cashier",
      "technician",
    ]);
  });

  it("no deja quitar el rol de dueño al último dueño activo", async () => {
    await expect(
      inTenant(() =>
        service.updateEmployee(ownerId, {
          ...employeeData(`owner.${tenantId}@test.local`, ["cashier"]),
        }),
      ),
    ).rejects.toBeInstanceOf(UserRoleRuleError);
    expect(await inTenant(() => roleDao.findRolesOf(ownerId))).toEqual(["owner"]);
  });

  it("no deja desactivar al último dueño activo", async () => {
    await expect(inTenant(() => service.toggleUserStatus(ownerId))).rejects.toThrow(
      "al menos un administrador activo",
    );
  });

  it("con otro dueño activo sí se puede degradar al primero", async () => {
    await inTenant(() =>
      service.updateEmployee(cashierId, {
        ...employeeData(`cashier.${tenantId}@test.local`, ["owner"]),
      }),
    );
    const demoted = await inTenant(() =>
      service.updateEmployee(ownerId, {
        ...employeeData(`owner.${tenantId}@test.local`, ["employee"]),
      }),
    );
    expect(demoted?.roles).toEqual(["employee"]);
  });

  it("los dueños de otro taller no cuentan", async () => {
    expect(
      await runWithTenant(otherTenantId, () => roleDao.countActiveOwners(foreignOwnerId)),
    ).toBe(0);
  });

  it("no edita usuarios de otro taller", async () => {
    expect(
      await inTenant(() =>
        service.updateEmployee(
          foreignOwnerId,
          employeeData(`x.${tenantId}@test.local`, ["cashier"]),
        ),
      ),
    ).toBeNull();
    expect(await runWithTenant(otherTenantId, () => roleDao.findRolesOf(foreignOwnerId))).toEqual([
      "owner",
    ]);
  });
});
