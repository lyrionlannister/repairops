import { describe, expect, it, vi, afterEach } from "vitest";
import { WhatsappSendService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-send.service.js";
import type { WhatsappOutboundMessageDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-outbound-message.dao.js";
import type { WhatsappTemplateStatusDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-template-status.dao.js";
import type { WhatsappTemplateCatalogEntryDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-template-catalog-entry.dao.js";
import type { WhatsappAccountService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-account.service.js";
import type { WhatsappQuotaService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-quota.service.js";
import { runWithTenant, getCurrentTenantId } from "../../../../src/core/tenancy/tenant-context.js";

// Reemplaza al Redis que usaba sendFreeTextOnce antes: la fila en
// whatsapp_outbound_messages (idempotencyKey) es ahora la marca de "ya se
// mandó", igual que fakeDao simula aquí (ver chat-message.dao real en
// produccion, tenant_id + idempotency_key unique).
function fakeOutboundDao() {
  const rows = new Map<string, { metaMessageId: string | null }>();
  const key = (idempotencyKey: string) => `${getCurrentTenantId()}:${idempotencyKey}`;
  return {
    findByIdempotencyKey: vi.fn(
      async (idempotencyKey: string) => rows.get(key(idempotencyKey)) ?? null,
    ),
    create: vi.fn(async (data: { idempotencyKey: string; metaMessageId: string | null }) => {
      const row = { metaMessageId: data.metaMessageId };
      rows.set(key(data.idempotencyKey), row);
      return row;
    }),
  } as unknown as WhatsappOutboundMessageDao;
}

function build(dao: WhatsappOutboundMessageDao) {
  return new WhatsappSendService(
    dao,
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

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("WhatsappSendService.sendFreeTextOnce", () => {
  it("primer intento: envia a Meta y devuelve el wamid de salida", async () => {
    const fetchMock = stubMeta();

    await expect(send(build(fakeOutboundDao()))).resolves.toBe("wamid.out-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reintento despues de un envio exitoso: no reenvia y recupera el mismo wamid", async () => {
    const fetchMock = stubMeta();
    const service = build(fakeOutboundDao());

    await send(service);
    await expect(send(service)).resolves.toBe("wamid.out-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("si Meta fallo, no deja marca bloqueante y el reintento si envia", async () => {
    const dao = fakeOutboundDao();
    const service = build(dao);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("red caida")));
    await expect(send(service)).rejects.toThrow();

    const fetchMock = stubMeta();
    await expect(send(service)).resolves.toBe("wamid.out-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // La fila fallida quedo bajo otra llave, nunca bajo la que revisa el reintento.
    expect(dao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        idempotencyKey: expect.stringContaining("status:wamid.in-1:failed:"),
      }),
    );
  });

  it("un envio sin wamid de Meta tambien cuenta como enviado", async () => {
    const fetchMock = stubMeta({});
    const service = build(fakeOutboundDao());

    await expect(send(service)).resolves.toBeNull();
    await expect(send(service)).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("la marca es por tenant: la misma clave en otro tenant no se considera enviada", async () => {
    const fetchMock = stubMeta();
    const service = build(fakeOutboundDao());

    await send(service, "tenant-a");
    await send(service, "tenant-b");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
