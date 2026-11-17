import { describe, expect, it, vi } from "vitest";
import { requireRole } from "../../../../src/identity/auth/middlewares/require-role.middleware.js";
import type { AuthenticatedRequest } from "../../../../src/identity/auth/middlewares/auth.middleware.js";
import type { Response } from "express";

function makeRes() {
  const res = { status: vi.fn(), json: vi.fn() } as unknown as Response;
  vi.mocked(res.status).mockReturnValue(res);
  return res;
}

describe("requireRole", () => {
  it("rejects an employee hitting an owner-or-cashier-only route with 403", () => {
    const req = { user: { id: "1", email: "e@x.com", tenantId: "1", role: "employee" } } as AuthenticatedRequest;
    const res = makeRes();
    const next = vi.fn();

    requireRole("owner", "cashier")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows a role included in the allowlist through", () => {
    const req = { user: { id: "1", email: "e@x.com", tenantId: "1", role: "cashier" } } as AuthenticatedRequest;
    const res = makeRes();
    const next = vi.fn();

    requireRole("owner", "cashier")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request with 403", () => {
    const req = {} as AuthenticatedRequest;
    const res = makeRes();
    const next = vi.fn();

    requireRole("owner")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
