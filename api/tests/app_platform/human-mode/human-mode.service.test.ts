import { beforeAll, describe, expect, it, vi } from "vitest";

// Con pool vmThreads un redis-client real cargado por otro archivo puede quedar en cache;
// se reimporta tras resetModules para que el servicio tome el mock de este archivo.
let redisClient: typeof import("../../../src/core/config/redis-client.js").redisClient;
let humanModeService: typeof import("../../../src/app_platform/human-mode/human-mode.service.js").humanModeService;
let runWithTenant: typeof import("../../../src/core/tenancy/tenant-context.js").runWithTenant;
let TenantContextError: typeof import("../../../src/core/tenancy/tenant-context.js").TenantContextError;
beforeAll(async () => {
  vi.resetModules();
  ({ runWithTenant, TenantContextError } = await import("../../../src/core/tenancy/tenant-context.js"));
  ({ redisClient } = await import("../../../src/core/config/redis-client.js"));
  ({ humanModeService } = await import("../../../src/app_platform/human-mode/human-mode.service.js"));
});

vi.mock("../../../src/core/config/redis-client.js", () => ({
  redisClient: { get: vi.fn(), set: vi.fn(), del: vi.fn() },
}));
vi.mock("../../../src/core/config/data-source.js", () => ({
  default: { getRepository: vi.fn().mockReturnValue({ save: vi.fn() }) },
}));

describe("humanModeService", () => {
  it("scopes the Redis key to the current tenant", async () => {
    vi.mocked(redisClient.get).mockResolvedValue("true");

    await runWithTenant("7", () => humanModeService.isActive("5215500000000"));

    expect(redisClient.get).toHaveBeenCalledWith("human_mode:7:5215500000000");
  });

  it("the same phone in two tenants uses two different keys", async () => {
    await runWithTenant("1", () => humanModeService.deactivate("5215500000000"));
    await runWithTenant("2", () => humanModeService.deactivate("5215500000000"));

    expect(redisClient.del).toHaveBeenCalledWith("human_mode:1:5215500000000");
    expect(redisClient.del).toHaveBeenCalledWith("human_mode:2:5215500000000");
  });

  it("refuses to run without a tenant in context", async () => {
    await expect(humanModeService.isActive("5215500000000")).rejects.toThrow(TenantContextError);
  });
});
