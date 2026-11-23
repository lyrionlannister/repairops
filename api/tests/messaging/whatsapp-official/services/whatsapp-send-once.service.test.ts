import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { WhatsappSendService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-send.service.js";
import type { WhatsappOutboundMessageDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-outbound-message.dao.js";
import type { WhatsappTemplateStatusDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-template-status.dao.js";
import type { WhatsappTemplateCatalogEntryDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-template-catalog-entry.dao.js";
import type { WhatsappAccountService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-account.service.js";
import type { WhatsappQuotaService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-quota.service.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";
import { redisClient } from "../../../../src/core/config/redis-client.js";

// spyOn y no vi.mock: con pool vmThreads otro archivo de la suite puede dejar
// cargado el redis-client real antes, y el vi.mock de este archivo no lo reemplaza.
const store = new Map<string, string>();

function build() {
  return new WhatsappSendService(
    {
      create: vi.fn().mockResolvedValue({ status: "sent" }),
    } as unknown as WhatsappOutboundMessageDao,
    {} as WhatsappTemplateStatusDao,
    {} as WhatsappTemplateCatalogEntryDao,
    {
      getOrCreateForTenant: vi
        .fn()
        .mockResolvedValue({ id: "acc-1", phoneNumberId: "phone-1", accessToken: "token-1" }),
    } as unknown as WhatsappAccountService,
    { assertCanSend: vi.fn().mockResolvedValue(undefined) } as unknown as WhatsappQuotaService,
  );
}

const send = (service: WhatsappSendService, tenantId = "tenant-1") =>
  runWithTenant(tenantId, () =>
    service.sendFreeTextOnce(
      "status:wamid.in-1",
      "phone-1",
      "token-1",
      "5215500000000",
      "hola",
      new Date(),
    ),
  );

function stubMeta(response: unknown = { messages: [{ id: "wamid.out-1" }] }) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => response });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  store.clear();
  vi.spyOn(redisClient, "get").mockImplementation(
    (async (key: string) => store.get(key) ?? null) as never,
  );
  vi.spyOn(redisClient, "set").mockImplementation((async (key: string, value: string) => {
    store.set(key, value);
    return "OK";
  }) as never);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("WhatsappSendService.sendFreeTextOnce", () => {
  it("primer intento: envia a Meta y devuelve el wamid de salida", async () => {
    const fetchMock = stubMeta();

    await expect(send(build())).resolves.toBe("wamid.out-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reintento despues de un envio exitoso: no reenvia y recupera el mismo wamid", async () => {
    const fetchMock = stubMeta();
    const service = build();

    await send(service);
    await expect(send(service)).resolves.toBe("wamid.out-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("si Meta fallo, no deja marca y el reintento si envia", async () => {
    const service = build();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("red caida")));
    await expect(send(service)).rejects.toThrow();

    const fetchMock = stubMeta();
    await expect(send(service)).resolves.toBe("wamid.out-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("un envio sin wamid de Meta tambien cuenta como enviado", async () => {
    const fetchMock = stubMeta({});
    const service = build();

    await expect(send(service)).resolves.toBeNull();
    await expect(send(service)).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("la marca es por tenant: la misma clave en otro tenant no se considera enviada", async () => {
    const fetchMock = stubMeta();
    const service = build();

    await send(service, "tenant-a");
    await send(service, "tenant-b");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
