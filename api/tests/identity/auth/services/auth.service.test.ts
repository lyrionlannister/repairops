import { hash } from "bcryptjs";
import { describe, expect, it, vi } from "vitest";
import { AuthService } from "../../../../src/identity/auth/services/auth.service.js";
import type { UserDao } from "../../../../src/identity/auth/daos/user.dao.js";
import type { User } from "../../../../src/identity/auth/entities/user.entity.js";
import type { Repository } from "typeorm";
import type { Tenant } from "../../../../src/core/tenancy/entities/tenant.entity.js";
import type { ServiceTypeService } from "../../../../src/commerce/service-types/services/service-type.service.js";
import type { BranchService } from "../../../../src/identity/branches/services/branch.service.js";
import type { UserBranchService } from "../../../../src/identity/branches/services/user-branch.service.js";
import type { BillingService } from "../../../../src/app_platform/billing/services/billing.service.js";
import type { PlanLimitService } from "../../../../src/app_platform/billing/services/plan-limit.service.js";
import type { UserRoleDao } from "../../../../src/identity/auth/daos/user-role.dao.js";

function makeUserRoleDao(rolesByUser: Record<string, string[]> = {}): UserRoleDao {
  return {
    findRolesOf: vi.fn((id: string) => Promise.resolve(rolesByUser[id] ?? ["owner"])),
    findAllOfTenant: vi.fn().mockResolvedValue(new Map(Object.entries(rolesByUser))),
    replaceForUser: vi.fn().mockResolvedValue(undefined),
    countActiveOwners: vi.fn().mockResolvedValue(1),
  } as unknown as UserRoleDao;
}

function makeBillingService(): BillingService {
  return { startSubscription: vi.fn().mockResolvedValue({}) } as unknown as BillingService;
}

function makePlanLimitService(): PlanLimitService {
  return {
    withCapacity: vi.fn((_resource: string, fn: () => Promise<unknown>) => fn()),
  } as unknown as PlanLimitService;
}

function makeServiceTypeService(): ServiceTypeService {
  return { seed: vi.fn() } as unknown as ServiceTypeService;
}

function makeBranchService(): BranchService {
  return { seed: vi.fn() } as unknown as BranchService;
}

function makeUserBranchService(): UserBranchService {
  return {
    normalize: vi.fn().mockResolvedValue({ branchIds: ["1"], primaryBranchId: "1" }),
    assign: vi.fn().mockResolvedValue(undefined),
    getAssignments: vi.fn().mockResolvedValue(new Map()),
  } as unknown as UserBranchService;
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    tenantId: "11111111-1111-1111-1111-111111111111",
    firstName: "Admin",
    lastName: "User",
    email: "admin@example.com",
    password: "",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User;
}

function makeTenantRepository(): Repository<Tenant> {
  return {
    create: vi.fn((data: any) => data),
    save: vi.fn((tenant: any) =>
      Promise.resolve({ id: "11111111-1111-1111-1111-111111111111", ...tenant }),
    ),
  } as unknown as Repository<Tenant>;
}

describe("AuthService.login", () => {
  it("rejects an email that isn't registered", async () => {
    const userDao = {
      findByEmailAcrossTenants: vi.fn().mockResolvedValue(null),
    } as unknown as UserDao;
    const service = new AuthService(userDao, makeTenantRepository(), makeServiceTypeService(), makeBranchService(), makeUserBranchService(), makeBillingService(), makePlanLimitService(), makeUserRoleDao());

    await expect(
      service.login({ email: "nobody@example.com", password: "whatever" }),
    ).rejects.toThrow("Correo electrónico no registrado");
  });

  it("rejects an incorrect password", async () => {
    const hashed = await hash("correct-password", 10);
    const userDao = {
      findByEmailAcrossTenants: vi.fn().mockResolvedValue(makeUser({ password: hashed })),
    } as unknown as UserDao;
    const service = new AuthService(userDao, makeTenantRepository(), makeServiceTypeService(), makeBranchService(), makeUserBranchService(), makeBillingService(), makePlanLimitService(), makeUserRoleDao());

    await expect(
      service.login({ email: "admin@example.com", password: "wrong-password" }),
    ).rejects.toThrow("Contraseña invalida");
  });

  it("rejects an inactive user even with the correct password", async () => {
    const hashed = await hash("correct-password", 10);
    const userDao = {
      findByEmailAcrossTenants: vi
        .fn()
        .mockResolvedValue(makeUser({ password: hashed, isActive: false })),
    } as unknown as UserDao;
    const service = new AuthService(userDao, makeTenantRepository(), makeServiceTypeService(), makeBranchService(), makeUserBranchService(), makeBillingService(), makePlanLimitService(), makeUserRoleDao());

    await expect(
      service.login({ email: "admin@example.com", password: "correct-password" }),
    ).rejects.toThrow("Usuario inactivo");
  });

  it("returns a token and strips the password on a correct login", async () => {
    const hashed = await hash("correct-password", 10);
    const userDao = {
      findByEmailAcrossTenants: vi.fn().mockResolvedValue(makeUser({ password: hashed })),
    } as unknown as UserDao;
    const service = new AuthService(userDao, makeTenantRepository(), makeServiceTypeService(), makeBranchService(), makeUserBranchService(), makeBillingService(), makePlanLimitService(), makeUserRoleDao());

    const result = await service.login({
      email: "admin@example.com",
      password: "correct-password",
    });

    expect(result.token).toEqual(expect.any(String));
    expect(result.user).not.toHaveProperty("password");
    expect(result.user.email).toBe("admin@example.com");
    expect(result.user.roles).toEqual(["owner"]);
    expect(result.user.permissions).toContain("cash.authorize-variance");
    expect(result.user.permissions).not.toContain("platform.templates.manage");
  });

  it("el JWT solo lleva identidad: ni roles ni flag de plataforma", async () => {
    const hashed = await hash("correct-password", 10);
    const userDao = {
      findByEmailAcrossTenants: vi.fn().mockResolvedValue(makeUser({ password: hashed, isPlatformAdmin: true })),
    } as unknown as UserDao;
    const service = new AuthService(userDao, makeTenantRepository(), makeServiceTypeService(), makeBranchService(), makeUserBranchService(), makeBillingService(), makePlanLimitService(), makeUserRoleDao());

    const { token } = await service.login({ email: "admin@example.com", password: "correct-password" });
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());

    expect(Object.keys(payload).sort()).toEqual(["email", "exp", "iat", "id", "tenantId"]);
  });
});

describe("AuthService.register", () => {
  it("creates a new tenant and makes the registering user its owner", async () => {
    const create = vi.fn().mockImplementation((data) => Promise.resolve(makeUser(data)));
    const userDao = {
      findByEmailAcrossTenants: vi.fn().mockResolvedValue(null),
      create,
    } as unknown as UserDao;
    const tenantRepository = makeTenantRepository();
    const billingService = makeBillingService();
    const service = new AuthService(userDao, tenantRepository, makeServiceTypeService(), makeBranchService(), makeUserBranchService(), billingService, makePlanLimitService(), makeUserRoleDao());

    await service.register({
      firstName: "New",
      lastName: "User",
      email: "new@example.com",
      password: "plain-text-password",
    });

    expect(tenantRepository.save).toHaveBeenCalledOnce();
    const persisted = create.mock.calls[0][0];
    expect(persisted).not.toHaveProperty("role");
    expect(persisted.isPlatformAdmin).toBe(false);
    expect(billingService.startSubscription).toHaveBeenCalledWith("basico", "trialing");
    expect(persisted.password).not.toBe("plain-text-password");
  });

  it("registerPlatformAdmin creates its own tenant with an owner flagged as platform admin", async () => {
    const create = vi.fn().mockImplementation((data) => Promise.resolve(makeUser(data)));
    const userDao = {
      findByEmailAcrossTenants: vi.fn().mockResolvedValue(null),
      create,
    } as unknown as UserDao;
    const tenantRepository = makeTenantRepository();
    const billingService = makeBillingService();
    const service = new AuthService(userDao, tenantRepository, makeServiceTypeService(), makeBranchService(), makeUserBranchService(), billingService, makePlanLimitService(), makeUserRoleDao());

    await service.registerPlatformAdmin({
      firstName: "Admin",
      lastName: "Plataforma",
      email: "root@example.com",
      password: "plain-text-password",
    });

    expect(tenantRepository.save).toHaveBeenCalledOnce();
    expect(create.mock.calls[0][0]).toMatchObject({ isPlatformAdmin: true });
    expect(billingService.startSubscription).toHaveBeenCalledWith("platform", "active");
  });

  it("rejects a duplicate email without creating an orphan tenant", async () => {
    const userDao = {
      findByEmailAcrossTenants: vi.fn().mockResolvedValue(makeUser()),
      create: vi.fn(),
    } as unknown as UserDao;
    const tenantRepository = makeTenantRepository();
    const service = new AuthService(userDao, tenantRepository, makeServiceTypeService(), makeBranchService(), makeUserBranchService(), makeBillingService(), makePlanLimitService(), makeUserRoleDao());

    await expect(
      service.register({
        firstName: "Another",
        lastName: "User",
        email: "admin@example.com",
        password: "whatever123",
      }),
    ).rejects.toThrow("Correo electrónico ya registrado");
    expect(tenantRepository.save).not.toHaveBeenCalled();
  });
});

describe("AuthService.createEmployee", () => {
  it("creates an employee under the current tenant, never a new one", async () => {
    const create = vi.fn().mockImplementation((data) => Promise.resolve(makeUser(data)));
    const userDao = {
      findByEmail: vi.fn().mockResolvedValue(null),
      create,
    } as unknown as UserDao;
    const userRoleDao = makeUserRoleDao();
    const service = new AuthService(userDao, makeTenantRepository(), makeServiceTypeService(), makeBranchService(), makeUserBranchService(), makeBillingService(), makePlanLimitService(), userRoleDao);

    await service.createEmployee({
      firstName: "Tech",
      lastName: "One",
      email: "tech@example.com",
      password: "plain-text-password",
      roles: ["employee", "cashier"],
      salaryAmount: 4500,
      payCycle: "weekly",
    });

    const persisted = create.mock.calls[0][0];
    expect(userRoleDao.replaceForUser).toHaveBeenCalledWith(expect.anything(), ["employee", "cashier"]);
    expect(persisted.salaryAmount).toBe("4500.00");
    expect(persisted.payCycle).toBe("weekly");
    expect(persisted.password).not.toBe("plain-text-password");
  });

  it("rejects a duplicate email within the tenant", async () => {
    const userDao = {
      findByEmail: vi.fn().mockResolvedValue(makeUser()),
      create: vi.fn(),
    } as unknown as UserDao;
    const service = new AuthService(userDao, makeTenantRepository(), makeServiceTypeService(), makeBranchService(), makeUserBranchService(), makeBillingService(), makePlanLimitService(), makeUserRoleDao());

    await expect(
      service.createEmployee({
        firstName: "Dup",
        lastName: "User",
        email: "admin@example.com",
        password: "whatever123",
        roles: ["cashier"],
      }),
    ).rejects.toThrow("Correo electrónico ya registrado");
  });

  it.each([
    [["owner", "cashier"], "El administrador no se combina con otros roles"],
    [[], "Elige al menos un rol"],
  ])("rechaza roles %j", async (roles, message) => {
    const userDao = { findByEmail: vi.fn().mockResolvedValue(null), create: vi.fn() } as unknown as UserDao;
    const service = new AuthService(userDao, makeTenantRepository(), makeServiceTypeService(), makeBranchService(), makeUserBranchService(), makeBillingService(), makePlanLimitService(), makeUserRoleDao());

    await expect(
      service.createEmployee({
        firstName: "X",
        lastName: "Y",
        email: "x@example.com",
        password: "whatever123",
        roles: roles as never,
      }),
    ).rejects.toThrow(message);
    expect(userDao.create).not.toHaveBeenCalled();
  });
});

describe("AuthService.listEmployees", () => {
  it("only returns the fields a <Select> needs", async () => {
    const userDao = {
      findAll: vi.fn().mockResolvedValue([makeUser({ id: "1" }), makeUser({ id: "2" })]),
    } as unknown as UserDao;
    const service = new AuthService(userDao, makeTenantRepository(), makeServiceTypeService(), makeBranchService(), makeUserBranchService(), makeBillingService(), makePlanLimitService(), makeUserRoleDao({ "1": ["owner"], "2": ["employee", "cashier"] }));

    const employees = await service.listEmployees();

    expect(employees).toEqual([
      { id: "1", firstName: "Admin", lastName: "User", roles: ["owner"] },
      { id: "2", firstName: "Admin", lastName: "User", roles: ["employee", "cashier"] },
    ]);
  });
});
