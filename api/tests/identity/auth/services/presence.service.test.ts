import { describe, expect, it, vi } from "vitest";
import { PresenceService } from "../../../../src/identity/auth/services/presence.service.js";
import { runWithTenant, TenantContextError } from "../../../../src/core/tenancy/tenant-context.js";

const sets = new Map<string, Map<string, number>>();

vi.mock("../../../../src/core/config/redis-client.js", () => {
  const multi = () => {
    const ops: Array<() => void> = [];
    const chain = {
      zadd: (key: string, score: number, member: string) => {
        ops.push(() => {
          const set = sets.get(key) ?? new Map<string, number>();
          set.set(member, score);
          sets.set(key, set);
        });
        return chain;
      },
      zremrangebyscore: (key: string, _min: string, max: number) => {
        ops.push(() => sets.get(key)?.forEach((score, member, set) => score <= max && set.delete(member)));
        return chain;
      },
      expire: () => chain,
      exec: async () => ops.forEach((op) => op()),
    };
    return chain;
  };
  return {
    redisClient: {
      multi,
      zcount: async (key: string, min: number) =>
        [...(sets.get(key)?.values() ?? [])].filter((score) => score >= min).length,
    },
  };
});

describe("PresenceService aislamiento por tenant", () => {
  it("los usuarios conectados de un tenant no cuentan en otro", async () => {
    const service = new PresenceService();

    await runWithTenant("101", () => service.touch("1"));
    await runWithTenant("101", () => service.touch("2"));
    await runWithTenant("202", () => service.touch("3"));

    expect(await runWithTenant("101", () => service.countOnline())).toBe(2);
    expect(await runWithTenant("202", () => service.countOnline())).toBe(1);
    expect(await runWithTenant("303", () => service.countOnline())).toBe(0);
  });

  it("el mismo usuario repetido cuenta una sola vez", async () => {
    const service = new PresenceService();

    await runWithTenant("404", () => service.touch("9"));
    await runWithTenant("404", () => service.touch("9"));

    expect(await runWithTenant("404", () => service.countOnline())).toBe(1);
  });

  it("no corre sin tenant en contexto", async () => {
    await expect(new PresenceService().touch("1")).rejects.toThrow(TenantContextError);
  });
});
