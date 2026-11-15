import { describe, expect, it, vi } from "vitest";
import { requirePlatformAdmin } from "../../../../src/identity/auth/middlewares/require-platform-admin.middleware.js";
import type { AuthenticatedRequest } from "../../../../src/identity/auth/middlewares/auth.middleware.js";
import type { Response } from "express";

function makeRes() {
  const res = { status: vi.fn(), json: vi.fn() } as unknown as Response;
  vi.mocked(res.status).mockReturnValue(res);
  return res;
}

describe("requirePlatformAdmin", () => {
  it("rejects a normal owner (isPlatformAdmin missing) with 403", () => {
    const req = { user: { id: "1", email: "e@x.com", tenantId: "1", role: "owner" } } as AuthenticatedRequest;
    const res = makeRes();
    const next = vi.fn();

    requirePlatformAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects isPlatformAdmin: false with 403", () => {
    const req = {
      user: { id: "1", email: "e@x.com", tenantId: "1", role: "owner", isPlatformAdmin: false },
    } as AuthenticatedRequest;
    const res = makeRes();
    const next = vi.fn();

    requirePlatformAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows isPlatformAdmin: true through regardless of role", () => {
    const req = {
      user: { id: "1", email: "e@x.com", tenantId: "1", role: "employee", isPlatformAdmin: true },
    } as AuthenticatedRequest;
    const res = makeRes();
    const next = vi.fn();

    requirePlatformAdmin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request with 403", () => {
    const req = {} as AuthenticatedRequest;
    const res = makeRes();
    const next = vi.fn();

    requirePlatformAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
