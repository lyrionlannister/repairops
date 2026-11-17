import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WhatsappTenantResolver } from "../../../../src/messaging/whatsapp-official/services/whatsapp-tenant-resolver.service.js";
import type { WhatsappAccountDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-account.dao.js";
import type { WhatsappAccount } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-account.entity.js";
import type { RepairNote } from "../../../../src/commerce/repair-notes/entities/repair-note.entity.js";
import { mockEntity } from "../../../support/mock-entity.js";

const store = new Map<string, string>();
vi.mock("../../../../src/core/config/redis-client.js", () => ({
  redisClient: {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => void store.set(key, value)),
    expire: vi.fn(async () => 1),
  },
}));

const acct = (tenantId: string, ownedByPlatform: boolean) =>
  mockEntity<WhatsappAccount>({ id: `acc-${tenantId}`, tenantId, phoneNumberId: "pn-1", ownedByPlatform });

function build(accounts: WhatsappAccount[], notesByRef: Record<string, RepairNote> = {}) {
  const dao = { findAllByPhoneNumberId: vi.fn().mockResolvedValue(accounts) } as unknown as WhatsappAccountDao;
  const noteRepository = {
    findOneBy: vi.fn(async ({ publicRef }: { publicRef: string }) => notesByRef[publicRef] ?? null),
  } as any;
  return new WhatsappTenantResolver(dao, noteRepository);
}

const noteOf = (tenantId: string, publicRef: string) => mockEntity<RepairNote>({ id: `n-${publicRef}`, tenantId, publicRef });

beforeEach(() => store.clear());
afterEach(() => vi.restoreAllMocks());

describe("WhatsappTenantResolver", () => {
  it("cuenta propia: resuelve por phone_number_id sin tocar Redis", async () => {
    const resolver = build([acct("t1", false)]);
    const result = await resolver.resolve("pn-1", "5215500000000", "hola");
    expect(result?.account.tenantId).toBe("t1");
    expect(result?.note).toBeNull();
    expect(store.size).toBe(0);
  });

  it("cuenta propia: un ref de otro tenant no liga ninguna nota", async () => {
    const resolver = build([acct("t1", false)], { "7F3K2A9B": noteOf("t2", "7F3K2A9B") });
    const result = await resolver.resolve("pn-1", "5215500000000", "(ref: 7F3K2A9B)");
    expect(result?.account.tenantId).toBe("t1");
    expect(result?.note).toBeNull();
  });

  it("cuenta compartida: el ref atribuye el mensaje al tenant correcto", async () => {
    const resolver = build([acct("t1", true), acct("t2", true)], {
      AAAAAAAA: noteOf("t1", "AAAAAAAA"),
      BBBBBBBB: noteOf("t2", "BBBBBBBB"),
    });
    expect((await resolver.resolve("pn-1", "521", "(ref: AAAAAAAA)"))?.account.tenantId).toBe("t1");
    expect((await resolver.resolve("pn-1", "522", "(ref: BBBBBBBB)"))?.account.tenantId).toBe("t2");
  });

  it("cuenta compartida: un mensaje posterior sin ref usa la asociacion guardada", async () => {
    const resolver = build([acct("t1", true), acct("t2", true)], { BBBBBBBB: noteOf("t2", "BBBBBBBB") });
    await resolver.resolve("pn-1", "522", "(ref: BBBBBBBB)");

    const next = await resolver.resolve("pn-1", "522", "sigues ahi?");
    expect(next?.account.tenantId).toBe("t2");
    expect(next?.note).toBeNull();
  });

  it("cuenta compartida sin ref ni asociacion: se descarta y nunca se elige un tenant", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const resolver = build([acct("t1", true), acct("t2", true)]);
    expect(await resolver.resolve("pn-1", "5215500001234", "hola")).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("sin tenant atribuible"),
      expect.objectContaining({ from: "***1234" }),
    );
  });

  it("un ref inexistente en cuenta compartida no atribuye nada", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const resolver = build([acct("t1", true), acct("t2", true)]);
    expect(await resolver.resolve("pn-1", "521", "(ref: ZZZZZZZZ)")).toBeNull();
  });

  it("phone_number_id sin cuenta: descarta", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(await build([]).resolve("pn-x", "521", "hola")).toBeNull();
  });
});
