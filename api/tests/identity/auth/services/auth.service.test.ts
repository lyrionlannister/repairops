import { hash } from "bcryptjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
import type { StripePriceDao } from "../../../../src/app_platform/billing/daos/stripe-price.dao.js";
import type { SubscriptionDao } from "../../../../src/app_platform/billing/daos/subscription.dao.js";
import type { RefreshTokenDao } from "../../../../src/identity/auth/daos/refresh-token.dao.js";
import type { TenantInvitationDao } from "../../../../src/identity/auth/daos/tenant-invitation.dao.js";
import type { EmailVerificationTokenDao } from "../../../../src/identity/auth/daos/email-verification-token.dao.js";
import type { AuditLogService } from "../../../../src/core/audit/services/audit-log.service.js";

// Mock compartido de Stripe (tests/support/stripe-client.mock.ts): con
// pool vmThreads el servicio queda ligado a la instancia del primer
// archivo que lo importa; si cada archivo usa su propia factoría, los
// demás afirman sobre otra instancia (0 llamadas) o sobre el cliente
// real ("Falta STRIPE_PRIVATE_KEY") solo en la suite completa.
vi.mock(
  "../../../../src/app_platform/billing/clients/stripe.client.js",
  async () => (await import("../../../support/stripe-client.mock.js")).stripeClientMock,
);

// Mismo motivo, para Resend (tests/support/resend-client.mock.ts).
vi.mock(
  "../../../../src/identity/auth/clients/resend.client.js",
  async () => (await import("../../../support/resend-client.mock.js")).resendClientMock,
);
import { resendClientMock } from "../../../support/resend-client.mock.js";

function makeUserRoleDao(rolesByUser: Record<string, string[]> = {}): UserRoleDao {
  return {
    findRolesOf: vi.fn((id: string) => Promise.resolve(rolesByUser[id] ?? ["owner"])),
    findAllOfTenant: vi.fn().mockResolvedValue(new Map(Object.entries(rolesByUser))),
    replaceForUser: vi.fn().mockResolvedValue(undefined),
    countActiveOwners: vi.fn().mockResolvedValue(1),
  } as unknown as UserRoleDao;
}

function makeBillingService(): BillingService {
  return {
    createCustomerForTenant: vi.fn().mockResolvedValue("cus_test123"),
    startSubscription: vi.fn().mockResolvedValue({}),
    startSubscriptionWithoutPlan: vi.fn().mockResolvedValue({}),
  } as unknown as BillingService;
}

function makePlanLimitService(): PlanLimitService {
  return {
    withCapacity: vi.fn((_resource: string, fn: () => Promise<unknown>) => fn()),
  } as unknown as PlanLimitService;
}

function makeStripePriceDao(
  price: Partial<{ stripePriceId: string }> | null = null,
): StripePriceDao {
  return { findByKey: vi.fn().mockResolvedValue(price) } as unknown as StripePriceDao;
}

// findCurrent() -> null: ningún test de login ejercita el gate de 'incomplete'
// a propósito, así se comporta igual que antes de agregarlo.
function makeSubscriptionDao(): SubscriptionDao {
  return { findCurrent: vi.fn().mockResolvedValue(null) } as unknown as SubscriptionDao;
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

function makeRefreshTokenDao(): RefreshTokenDao {
  return {
    create: vi
      .fn()
      .mockImplementation((data: unknown) => Promise.resolve({ id: "1", ...(data as object) })),
    update: vi.fn().mockResolvedValue(undefined),
    findByTokenHash: vi.fn().mockResolvedValue(null),
    revokeAllForUser: vi.fn().mockResolvedValue(undefined),
  } as unknown as RefreshTokenDao;
}

function makeTenantInvitationDao(): TenantInvitationDao {
  return {
    findByTokenHash: vi.fn().mockResolvedValue(null),
    consume: vi.fn().mockResolvedValue(true),
    create: vi.fn().mockResolvedValue({}),
    listPending: vi.fn().mockResolvedValue([]),
  } as unknown as TenantInvitationDao;
}

function makeEmailVerificationTokenDao(): EmailVerificationTokenDao {
  return {
    findByTokenHash: vi.fn().mockResolvedValue(null),
    consume: vi.fn().mockResolvedValue(true),
    create: vi
      .fn()
      .mockImplementation((data: unknown) => Promise.resolve({ id: "1", ...(data as object) })),
    invalidatePendingForUser: vi.fn().mockResolvedValue(undefined),
  } as unknown as EmailVerificationTokenDao;
}

function makeAuditLogService(): AuditLogService {
  return {
    record: vi.fn().mockResolvedValue(undefined),
    recordForCurrentActor: vi.fn().mockResolvedValue(undefined),
  } as unknown as AuditLogService;
}

// Constructor completo: los 4 últimos son los DAOs/servicios nuevos
// (refresh, invitaciones, verificación de correo, bitácora). Los tests pasan
// solo lo que varían.
function makeAuthService(deps: {
  userDao: UserDao;
  tenantRepository?: Repository<Tenant>;
  billingService?: BillingService;
  stripePriceDao?: StripePriceDao;
  userRoleDao?: UserRoleDao;
  refreshTokenDao?: RefreshTokenDao;
  tenantInvitationDao?: TenantInvitationDao;
  emailVerificationTokenDao?: EmailVerificationTokenDao;
  auditLogService?: AuditLogService;
}): AuthService {
  return new AuthService(
    deps.userDao,
    deps.tenantRepository ?? makeTenantRepository(),
    makeServiceTypeService(),
    makeBranchService(),
    makeUserBranchService(),
    deps.billingService ?? makeBillingService(),
    makePlanLimitService(),
    deps.stripePriceDao ?? makeStripePriceDao(),
    makeSubscriptionDao(),
    deps.userRoleDao ?? makeUserRoleDao(),
    deps.refreshTokenDao ?? makeRefreshTokenDao(),
    deps.tenantInvitationDao ?? makeTenantInvitationDao(),
    deps.emailVerificationTokenDao ?? makeEmailVerificationTokenDao(),
    deps.auditLogService ?? makeAuditLogService(),
  );
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "1",
    publicId: "01a205b6-ac88-71bd-9308-81a096468dfb",
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
    findOneByOrFail: vi.fn().mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      publicId: "01a205b6-0000-7000-8000-00000000aaaa",
    }),
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
    const service = makeAuthService({
      userDao: userDao,
    });

    await expect(
      service.login({ email: "nobody@example.com", password: "whatever" }),
    ).rejects.toThrow("Correo o contraseña inválidos");
  });

  it("rejects an incorrect password", async () => {
    const hashed = await hash("correct-password", 10);
    const userDao = {
      findByEmailAcrossTenants: vi.fn().mockResolvedValue(makeUser({ password: hashed })),
    } as unknown as UserDao;
    const service = makeAuthService({
      userDao: userDao,
    });

    await expect(
      service.login({ email: "admin@example.com", password: "wrong-password" }),
    ).rejects.toThrow("Correo o contraseña inválidos");
  });

  it("rejects an inactive user even with the correct password", async () => {
    const hashed = await hash("correct-password", 10);
    const userDao = {
      findByEmailAcrossTenants: vi
        .fn()
        .mockResolvedValue(makeUser({ password: hashed, isActive: false })),
    } as unknown as UserDao;
    const service = makeAuthService({
      userDao: userDao,
    });

    await expect(
      service.login({ email: "admin@example.com", password: "correct-password" }),
    ).rejects.toThrow("Correo o contraseña inválidos");
  });

  it("returns a token and strips the password on a correct login", async () => {
    const hashed = await hash("correct-password", 10);
    const userDao = {
      findByEmailAcrossTenants: vi.fn().mockResolvedValue(makeUser({ password: hashed })),
    } as unknown as UserDao;
    const service = makeAuthService({
      userDao: userDao,
    });

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
      findByEmailAcrossTenants: vi
        .fn()
        .mockResolvedValue(makeUser({ password: hashed, isPlatformAdmin: true })),
    } as unknown as UserDao;
    const service = makeAuthService({
      userDao: userDao,
    });

    const { token } = await service.login({
      email: "admin@example.com",
      password: "correct-password",
    });
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());

    expect(Object.keys(payload).sort()).toEqual(["email", "exp", "iat", "id", "tenantId"]);
    expect(payload.id).toBe("01a205b6-ac88-71bd-9308-81a096468dfb");
    expect(payload.tenantId).toBe("01a205b6-0000-7000-8000-00000000aaaa");
  });
});

describe("AuthService.register", () => {
  beforeEach(() => {
    process.env.REGISTRATION_MODE = "open";
  });
  afterEach(() => {
    delete process.env.REGISTRATION_MODE;
  });
  it("creates a new tenant and makes the registering user its owner", async () => {
    const create = vi.fn().mockImplementation((data) => Promise.resolve(makeUser(data)));
    const userDao = {
      findByEmailAcrossTenants: vi.fn().mockResolvedValue(null),
      create,
    } as unknown as UserDao;
    const tenantRepository = makeTenantRepository();
    const billingService = makeBillingService();
    const emailVerificationTokenDao = makeEmailVerificationTokenDao();
    resendClientMock.sendVerificationEmail.mockClear();
    const service = makeAuthService({
      userDao: userDao,
      tenantRepository: tenantRepository,
      billingService: billingService,
      emailVerificationTokenDao,
    });

    const result = await service.register({
      firstName: "New",
      lastName: "User",
      email: "new@example.com",
      password: "plain-text-password",
    });

    expect(tenantRepository.save).toHaveBeenCalledOnce();
    const persisted = create.mock.calls[0][0];
    expect(persisted).not.toHaveProperty("role");
    expect(persisted.isPlatformAdmin).toBe(false);
    // El owner público nace sin verificar: solo lo levanta el enlace que
    // manda issueEmailVerification (ver AuthService.register).
    expect(persisted.emailVerifiedAt).toBeNull();
    expect(billingService.startSubscriptionWithoutPlan).toHaveBeenCalledWith("cus_test123");
    expect(persisted.password).not.toBe("plain-text-password");
    expect(result.token).toBeTruthy();
    expect(emailVerificationTokenDao.create).toHaveBeenCalledOnce();
    expect(resendClientMock.sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "new@example.com" }),
    );
  });

  it("registerPlatformAdmin creates its own tenant with an owner flagged as platform admin", async () => {
    const create = vi.fn().mockImplementation((data) => Promise.resolve(makeUser(data)));
    const userDao = {
      findByEmailAcrossTenants: vi.fn().mockResolvedValue(null),
      create,
    } as unknown as UserDao;
    const tenantRepository = makeTenantRepository();
    const billingService = makeBillingService();
    resendClientMock.sendVerificationEmail.mockClear();
    const service = makeAuthService({
      userDao: userDao,
      tenantRepository: tenantRepository,
      billingService: billingService,
    });

    await service.registerPlatformAdmin({
      firstName: "Admin",
      lastName: "Plataforma",
      email: "root@example.com",
      password: "plain-text-password",
    });

    expect(tenantRepository.save).toHaveBeenCalledOnce();
    expect(create.mock.calls[0][0]).toMatchObject({ isPlatformAdmin: true });
    // Un admin de plataforma no pasa por el gate: nace ya verificado.
    expect(create.mock.calls[0][0].emailVerifiedAt).toEqual(expect.any(Date));
    expect(billingService.startSubscription).toHaveBeenCalledWith("platform", "active");
    expect(resendClientMock.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("rejects a duplicate email without creating an orphan tenant", async () => {
    const userDao = {
      findByEmailAcrossTenants: vi.fn().mockResolvedValue(makeUser()),
      create: vi.fn(),
    } as unknown as UserDao;
    const tenantRepository = makeTenantRepository();
    const service = makeAuthService({
      userDao: userDao,
      tenantRepository: tenantRepository,
    });

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
    const service = makeAuthService({
      userDao: userDao,
      userRoleDao: userRoleDao,
    });

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
    expect(userRoleDao.replaceForUser).toHaveBeenCalledWith(expect.anything(), [
      "employee",
      "cashier",
    ]);
    expect(persisted.salaryAmount).toBe("4500.00");
    expect(persisted.payCycle).toBe("weekly");
    expect(persisted.password).not.toBe("plain-text-password");
  });

  it("rejects a duplicate email within the tenant", async () => {
    const userDao = {
      findByEmail: vi.fn().mockResolvedValue(makeUser()),
      create: vi.fn(),
    } as unknown as UserDao;
    const service = makeAuthService({
      userDao: userDao,
    });

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
    const userDao = {
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
    } as unknown as UserDao;
    const service = makeAuthService({
      userDao: userDao,
    });

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
      findAll: vi
        .fn()
        .mockResolvedValue([
          makeUser({ id: "1", publicId: "p-1" }),
          makeUser({ id: "2", publicId: "p-2" }),
        ]),
    } as unknown as UserDao;
    const service = makeAuthService({
      userDao: userDao,
      userRoleDao: makeUserRoleDao({ "1": ["owner"], "2": ["employee", "cashier"] }),
    });

    const employees = await service.listEmployees();

    expect(employees).toEqual([
      { id: "1", publicId: "p-1", firstName: "Admin", lastName: "User", isActive: true, roles: ["owner"] },
      {
        id: "2",
        publicId: "p-2",
        firstName: "Admin",
        lastName: "User",
        isActive: true,
        roles: ["employee", "cashier"],
      },
    ]);
  });
});

describe("AuthService.register modes", () => {
  afterEach(() => {
    delete process.env.REGISTRATION_MODE;
  });

  const basePayload = {
    firstName: "New",
    lastName: "User",
    email: "new@example.com",
    password: "plain-text-password",
  };

  it("rejects public registration when the mode is closed", async () => {
    process.env.REGISTRATION_MODE = "closed";
    const service = makeAuthService({
      userDao: { findByEmailAcrossTenants: vi.fn() } as unknown as UserDao,
    });
    await expect(service.register(basePayload)).rejects.toThrow("El registro está cerrado");
  });

  it("allows public registration by default (open) with no env var set", async () => {
    const create = vi
      .fn()
      .mockImplementation((data: unknown) => Promise.resolve(makeUser(data as object)));
    const userDao = {
      findByEmailAcrossTenants: vi.fn().mockResolvedValue(null),
      create,
    } as unknown as UserDao;
    const service = makeAuthService({
      userDao,
      billingService: makeBillingService(),
      stripePriceDao: makeStripePriceDao({ stripePriceId: "price_test123" }),
    });
    const result = await service.register(basePayload);
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(create).toHaveBeenCalledOnce();
  });

  it("requires an invitation token in invite mode", async () => {
    process.env.REGISTRATION_MODE = "invite";
    const service = makeAuthService({
      userDao: { findByEmailAcrossTenants: vi.fn() } as unknown as UserDao,
    });
    await expect(service.register(basePayload)).rejects.toThrow(
      "Se requiere un token de invitación",
    );
  });

  it("rejects an invalid invitation token in invite mode", async () => {
    process.env.REGISTRATION_MODE = "invite";
    const service = makeAuthService({
      userDao: { findByEmailAcrossTenants: vi.fn() } as unknown as UserDao,
      tenantInvitationDao: {
        findByTokenHash: vi.fn().mockResolvedValue(null),
        consume: vi.fn(),
      } as unknown as TenantInvitationDao,
    });
    await expect(service.register({ ...basePayload, invitationToken: "nope" })).rejects.toThrow(
      "Invitación inválida o expirada",
    );
  });

  it("accepts a valid invitation and consumes it exactly once", async () => {
    process.env.REGISTRATION_MODE = "invite";
    const consume = vi.fn().mockResolvedValue(true);
    const tenantInvitationDao = {
      findByTokenHash: vi.fn().mockResolvedValue({
        usedAt: null,
        expiresAt: new Date(Date.now() + 3_600_000),
      }),
      consume,
    } as unknown as TenantInvitationDao;
    const create = vi
      .fn()
      .mockImplementation((data: unknown) => Promise.resolve(makeUser(data as object)));
    const userDao = {
      findByEmailAcrossTenants: vi.fn().mockResolvedValue(null),
      create,
    } as unknown as UserDao;
    const service = makeAuthService({
      userDao,
      tenantInvitationDao,
      billingService: makeBillingService(),
      stripePriceDao: makeStripePriceDao({ stripePriceId: "price_test123" }),
    });
    const result = await service.register({ ...basePayload, invitationToken: "tok123" });
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(consume).toHaveBeenCalledOnce();
  });
});

describe("AuthService.verifyEmail", () => {
  const makeRow = (overrides: object = {}) =>
    ({
      id: "20",
      userId: "1",
      tenantId: "11111111-1111-1111-1111-111111111111",
      tokenHash: "abc",
      consumedAt: null,
      expiresAt: new Date(Date.now() + 3_600_000),
      ...overrides,
    }) as unknown as import("../../../../src/identity/auth/entities/email-verification-token.entity.js").EmailVerificationToken;

  it("marks the user verified and consumes the token", async () => {
    const emailVerificationTokenDao = makeEmailVerificationTokenDao();
    vi.mocked(emailVerificationTokenDao.findByTokenHash).mockResolvedValue(makeRow());
    const update = vi.fn().mockResolvedValue(makeUser({ emailVerifiedAt: new Date() }));
    const userDao = { update } as unknown as UserDao;
    const service = makeAuthService({ userDao, emailVerificationTokenDao });

    const result = await service.verifyEmail("plain-token");

    expect(update).toHaveBeenCalledWith("1", { emailVerifiedAt: expect.any(Date) });
    expect(emailVerificationTokenDao.consume).toHaveBeenCalledOnce();
    expect(result.emailVerifiedAt).toEqual(expect.any(Date));
  });

  it("rejects a token that doesn't exist", async () => {
    const emailVerificationTokenDao = makeEmailVerificationTokenDao();
    vi.mocked(emailVerificationTokenDao.findByTokenHash).mockResolvedValue(null);
    const service = makeAuthService({
      userDao: {} as unknown as UserDao,
      emailVerificationTokenDao,
    });
    await expect(service.verifyEmail("nope")).rejects.toThrow(
      "El código de verificación es inválido o expiró",
    );
  });

  it("rejects an expired token", async () => {
    const emailVerificationTokenDao = makeEmailVerificationTokenDao();
    vi.mocked(emailVerificationTokenDao.findByTokenHash).mockResolvedValue(
      makeRow({ expiresAt: new Date(Date.now() - 1000) }),
    );
    const service = makeAuthService({
      userDao: {} as unknown as UserDao,
      emailVerificationTokenDao,
    });
    await expect(service.verifyEmail("old-token")).rejects.toThrow(
      "El código de verificación es inválido o expiró",
    );
  });

  it("rejects an already-used token", async () => {
    const emailVerificationTokenDao = makeEmailVerificationTokenDao();
    vi.mocked(emailVerificationTokenDao.findByTokenHash).mockResolvedValue(
      makeRow({ consumedAt: new Date() }),
    );
    const service = makeAuthService({
      userDao: {} as unknown as UserDao,
      emailVerificationTokenDao,
    });
    await expect(service.verifyEmail("used-token")).rejects.toThrow(
      "El código de verificación es inválido o expiró",
    );
  });
});

describe("AuthService.resendVerificationEmail", () => {
  it("invalidates pending tokens and issues a new one", async () => {
    const user = makeUser({ emailVerifiedAt: null });
    const userDao = { findById: vi.fn().mockResolvedValue(user) } as unknown as UserDao;
    const emailVerificationTokenDao = makeEmailVerificationTokenDao();
    resendClientMock.sendVerificationEmail.mockClear();
    const service = makeAuthService({ userDao, emailVerificationTokenDao });

    await service.resendVerificationEmail("1");

    expect(emailVerificationTokenDao.invalidatePendingForUser).toHaveBeenCalledWith(
      user.id,
      user.tenantId,
    );
    expect(emailVerificationTokenDao.create).toHaveBeenCalledOnce();
    expect(resendClientMock.sendVerificationEmail).toHaveBeenCalledOnce();
  });

  it("rejects when the email is already verified", async () => {
    const userDao = {
      findById: vi.fn().mockResolvedValue(makeUser({ emailVerifiedAt: new Date() })),
    } as unknown as UserDao;
    const service = makeAuthService({ userDao });
    await expect(service.resendVerificationEmail("1")).rejects.toThrow(
      "Tu correo ya está verificado",
    );
  });
});

describe("AuthService.login sessions", () => {
  it("issues a 15-minute access token and a refresh token", async () => {
    const hashed = await hash("correct-password", 10);
    const userDao = {
      findByEmailAcrossTenants: vi.fn().mockResolvedValue(makeUser({ password: hashed })),
    } as unknown as UserDao;
    const service = makeAuthService({ userDao });
    const result = await service.login({
      email: "admin@example.com",
      password: "correct-password",
    });
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.refreshToken).not.toBe(result.token);
    const payload = JSON.parse(Buffer.from(result.token.split(".")[1], "base64url").toString()) as {
      exp: number;
      iat: number;
    };
    expect(payload.exp - payload.iat).toBe(900);
  });

  it("records failed logins in the audit log without revealing which check failed", async () => {
    const auditLogService = makeAuditLogService();
    const userDao = {
      findByEmailAcrossTenants: vi.fn().mockResolvedValue(null),
    } as unknown as UserDao;
    const service = makeAuthService({ userDao, auditLogService });
    await expect(
      service.login({ email: "nobody@example.com", password: "whatever" }),
    ).rejects.toThrow("Correo o contraseña inválidos");
    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "auth.login_failed",
        details: { reason: "email_not_found" },
      }),
    );
  });
});

describe("AuthService.refreshSession", () => {
  const makeRow = (overrides: object = {}) =>
    ({
      id: "10",
      userId: "1",
      tenantId: "11111111-1111-1111-1111-111111111111",
      tokenHash: "abc",
      replacedByTokenHash: null,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 3_600_000),
      ...overrides,
    }) as unknown as import("../../../../src/identity/auth/entities/refresh-token.entity.js").RefreshToken;

  it("rotates the refresh token and returns a new session", async () => {
    const refreshTokenDao = makeRefreshTokenDao();
    vi.mocked(refreshTokenDao.findByTokenHash).mockResolvedValue(makeRow());
    const userDao = {
      findById: vi.fn().mockResolvedValue(makeUser()),
    } as unknown as UserDao;
    const service = makeAuthService({ userDao, refreshTokenDao });
    const result = await service.refreshSession("old-token");
    expect(result.token).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(refreshTokenDao.update).toHaveBeenCalledWith(
      "10",
      expect.objectContaining({
        revokedAt: expect.any(Date),
        replacedByTokenHash: expect.any(String),
      }),
    );
  });

  it("revokes the whole family when a rotated token is reused", async () => {
    const refreshTokenDao = makeRefreshTokenDao();
    vi.mocked(refreshTokenDao.findByTokenHash).mockResolvedValue(
      makeRow({ revokedAt: new Date(), replacedByTokenHash: "def" }),
    );
    const service = makeAuthService({
      userDao: {} as unknown as UserDao,
      refreshTokenDao,
    });
    await expect(service.refreshSession("old-token")).rejects.toThrow("Sesión expirada");
    expect(refreshTokenDao.revokeAllForUser).toHaveBeenCalledWith(
      "1",
      "11111111-1111-1111-1111-111111111111",
    );
  });

  it("rejects expired and unknown refresh tokens", async () => {
    const refreshTokenDao = makeRefreshTokenDao();
    vi.mocked(refreshTokenDao.findByTokenHash).mockResolvedValue(
      makeRow({ expiresAt: new Date(Date.now() - 1_000) }),
    );
    const service = makeAuthService({
      userDao: {} as unknown as UserDao,
      refreshTokenDao,
    });
    await expect(service.refreshSession("old-token")).rejects.toThrow("Sesión expirada");
    vi.mocked(refreshTokenDao.findByTokenHash).mockResolvedValue(null);
    await expect(service.refreshSession("nope")).rejects.toThrow("Sesión expirada");
  });
});
