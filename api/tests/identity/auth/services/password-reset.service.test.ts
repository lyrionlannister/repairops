import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { compare } from "bcryptjs";

vi.mock("../../../../src/identity/auth/clients/resend.client.js", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

import { PasswordResetService } from "../../../../src/identity/auth/services/password-reset.service.js";
import { sendPasswordResetEmail } from "../../../../src/identity/auth/clients/resend.client.js";
import type { UserDao } from "../../../../src/identity/auth/daos/user.dao.js";
import type { RefreshTokenDao } from "../../../../src/identity/auth/daos/refresh-token.dao.js";
import type { PasswordResetTokenDao } from "../../../../src/identity/auth/daos/password-reset-token.dao.js";
import { makeAuditLogStub } from "../../../support/authz-deps.js";

const user = {
  id: "7",
  publicId: "u-7",
  tenantId: "70",
  email: "ana@taller.mx",
  firstName: "Ana",
  isActive: true,
};

describe("PasswordResetService", () => {
  let userDao: UserDao;
  let refreshTokenDao: RefreshTokenDao;
  let tokenDao: PasswordResetTokenDao;
  let service: PasswordResetService;

  beforeEach(() => {
    vi.mocked(sendPasswordResetEmail).mockClear();
    userDao = {
      findByEmailAcrossTenants: vi.fn().mockResolvedValue(user),
      update: vi.fn().mockImplementation(async (_id, data) => ({ ...user, ...data })),
    } as unknown as UserDao;
    refreshTokenDao = { revokeAllForUser: vi.fn() } as unknown as RefreshTokenDao;
    tokenDao = {
      create: vi.fn(),
      invalidatePendingForUser: vi.fn(),
      consume: vi.fn(),
    } as unknown as PasswordResetTokenDao;
    service = new PasswordResetService(userDao, refreshTokenDao, tokenDao, makeAuditLogStub());
  });

  it("does nothing and sends no email for an unknown or inactive account", async () => {
    vi.mocked(userDao.findByEmailAcrossTenants).mockResolvedValueOnce(null);
    await service.requestReset("nadie@taller.mx");
    vi.mocked(userDao.findByEmailAcrossTenants).mockResolvedValueOnce({
      ...user,
      isActive: false,
    } as never);
    await service.requestReset(user.email);
    expect(tokenDao.create).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("stores only the token hash and emails a link with the clear token", async () => {
    await service.requestReset(user.email);
    expect(tokenDao.invalidatePendingForUser).toHaveBeenCalledWith("7", "70");
    const stored = vi.mocked(tokenDao.create).mock.calls[0][0] as { tokenHash: string };
    const { resetUrl } = vi.mocked(sendPasswordResetEmail).mock.calls[0][0];
    const token = new URL(resetUrl).searchParams.get("token")!;
    expect(token).toHaveLength(64);
    expect(stored.tokenHash).not.toBe(token);
  });

  it("rejects an invalid or already used link", async () => {
    vi.mocked(tokenDao.consume).mockResolvedValue(null);
    await expect(service.resetPassword("x".repeat(64), "nueva-clave-1")).rejects.toThrow(
      "El enlace no es válido o ya venció",
    );
    expect(userDao.update).not.toHaveBeenCalled();
  });

  it("sets the hashed password and closes every open session", async () => {
    vi.mocked(tokenDao.consume).mockResolvedValue({
      id: "1",
      tenantId: "70",
      userId: "7",
    } as never);
    await service.resetPassword("a".repeat(64), "nueva-clave-1");
    const { password } = vi.mocked(userDao.update).mock.calls[0][1] as { password: string };
    expect(await compare("nueva-clave-1", password)).toBe(true);
    expect(refreshTokenDao.revokeAllForUser).toHaveBeenCalledWith("7", "70");
  });
});
