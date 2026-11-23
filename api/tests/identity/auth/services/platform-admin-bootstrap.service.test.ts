import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlatformAdminBootstrapService } from "../../../../src/identity/auth/services/platform-admin-bootstrap.service.js";
import type { UserDao } from "../../../../src/identity/auth/daos/user.dao.js";
import type { AuthService } from "../../../../src/identity/auth/services/auth.service.js";
import type { User } from "../../../../src/identity/auth/entities/user.entity.js";
import { mockEntity } from "../../../support/mock-entity.js";
// Mock compartido de Stripe (tests/support/stripe-client.mock.ts): con
// pool vmThreads el servicio queda ligado a la instancia del primer
// archivo que lo importa; si cada archivo usa su propia factoría, los
// demás afirman sobre otra instancia (0 llamadas) o sobre el cliente
// real ("Falta STRIPE_PRIVATE_KEY") solo en la suite completa.
vi.mock(
  "../../../../src/app_platform/billing/clients/stripe.client.js",
  async () => (await import("../../../support/stripe-client.mock.js")).stripeClientMock,
);

function makeUserDao(existing: User | null = null) {
  return { findByEmailAcrossTenants: vi.fn().mockResolvedValue(existing) } as unknown as UserDao;
}

function makeAuthService() {
  return {
    registerPlatformAdmin: vi.fn().mockResolvedValue(mockEntity<User>({ id: "1" })),
  } as unknown as AuthService;
}

describe("PlatformAdminBootstrapService.ensureFromEnv", () => {
  beforeEach(() => {
    process.env.PLATFORM_ADMIN_EMAIL = "root@example.com";
    process.env.PLATFORM_ADMIN_PASSWORD = "super-secret-123";
  });

  afterEach(() => {
    delete process.env.PLATFORM_ADMIN_EMAIL;
    delete process.env.PLATFORM_ADMIN_PASSWORD;
  });

  it("skips when the env vars are not set", async () => {
    delete process.env.PLATFORM_ADMIN_PASSWORD;
    const userDao = makeUserDao();
    const authService = makeAuthService();

    await expect(
      new PlatformAdminBootstrapService(userDao, authService).ensureFromEnv(),
    ).resolves.toBe("skipped");
    expect(userDao.findByEmailAcrossTenants).not.toHaveBeenCalled();
    expect(authService.registerPlatformAdmin).not.toHaveBeenCalled();
  });

  it("creates the platform admin when the email is free", async () => {
    const authService = makeAuthService();

    await expect(
      new PlatformAdminBootstrapService(makeUserDao(), authService).ensureFromEnv(),
    ).resolves.toBe("created");
    expect(authService.registerPlatformAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ email: "root@example.com", password: "super-secret-123" }),
    );
  });

  it("is idempotent: an existing platform admin is left untouched", async () => {
    const authService = makeAuthService();
    const existing = mockEntity<User>({ email: "root@example.com", isPlatformAdmin: true });

    await expect(
      new PlatformAdminBootstrapService(makeUserDao(existing), authService).ensureFromEnv(),
    ).resolves.toBe("exists");
    expect(authService.registerPlatformAdmin).not.toHaveBeenCalled();
  });

  it("never promotes an email someone already registered through the public sign-up", async () => {
    const authService = makeAuthService();
    const existing = mockEntity<User>({ email: "root@example.com", isPlatformAdmin: false });

    await expect(
      new PlatformAdminBootstrapService(makeUserDao(existing), authService).ensureFromEnv(),
    ).resolves.toBe("conflict");
    expect(authService.registerPlatformAdmin).not.toHaveBeenCalled();
  });

  it("fails loudly on a password that the sign-up itself would reject", async () => {
    process.env.PLATFORM_ADMIN_PASSWORD = "short";
    const authService = makeAuthService();

    await expect(
      new PlatformAdminBootstrapService(makeUserDao(), authService).ensureFromEnv(),
    ).rejects.toThrow("PLATFORM_ADMIN_* inválido");
    expect(authService.registerPlatformAdmin).not.toHaveBeenCalled();
  });
});
