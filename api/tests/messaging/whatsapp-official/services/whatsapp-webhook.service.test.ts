import { describe, expect, it, vi, afterEach } from "vitest";
import { WhatsappWebhookService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-webhook.service.js";
import type { WhatsappTenantResolver } from "../../../../src/messaging/whatsapp-official/services/whatsapp-tenant-resolver.service.js";
import type { WhatsappSendService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-send.service.js";
import type { ChatsService } from "../../../../src/messaging/chats/services/chats.service.js";
import type { ChatMediaService } from "../../../../src/messaging/chats/services/chat-media.service.js";
import type { WhatsappAutomationQueueService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-automation-queue.service.js";
import type { LocalService } from "../../../../src/app_platform/local/services/local.service.js";
import type { WhatsappAccount } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-account.entity.js";
import type { RepairNote } from "../../../../src/commerce/repair-notes/entities/repair-note.entity.js";
import { mockEntity } from "../../../support/mock-entity.js";
import { humanModeService } from "../../../../src/app_platform/human-mode/human-mode.service.js";

vi.mock("../../../../src/app_platform/human-mode/human-mode.service.js", () => ({
  humanModeService: { isActive: vi.fn(), activate: vi.fn(), deactivate: vi.fn() },
}));

const account = mockEntity<WhatsappAccount>({
  id: "acc-1",
  tenantId: "tenant-1",
  phoneNumberId: "phone-1",
  accessToken: "token-1",
});
const note = mockEntity<RepairNote>({
  id: "note-9",
  tenantId: "tenant-1",
  controlNumber: 1042,
  status: "done",
  publicRef: "7F3K2A9B",
});

function makeDeps(resolved: { account: WhatsappAccount; note: RepairNote | null } | null = { account, note }) {
  const tenantResolver = { resolve: vi.fn().mockResolvedValue(resolved) } as unknown as WhatsappTenantResolver;
  const sendFreeText = vi.fn().mockResolvedValue("wamid.out-1");
  const whatsappSendService = {
    sendFreeText,
    sendFreeTextOnce: vi.fn((_key: string, ...args: unknown[]) => sendFreeText(...args)),
  } as unknown as WhatsappSendService;
  const chatsService = { recordMessage: vi.fn().mockResolvedValue(undefined) } as unknown as ChatsService;
  const localService = { getConfig: vi.fn().mockResolvedValue({ name: "Celulares Pérez" }) } as unknown as LocalService;
  const chatMediaService = {
    ingest: vi.fn().mockResolvedValue({ mediaKey: "tenants/tenant-1/chat/5215500000000/wamid.in-1.jpg", mediaMime: "image/jpeg", mediaSize: 10 }),
  } as unknown as ChatMediaService;
  const excludedPhoneRepository = { exists: vi.fn().mockResolvedValue(false) } as any;
  const whatsappSettingsRepository = {
    findOneBy: vi.fn().mockResolvedValue({ tenantId: "tenant-1", aiRepliesEnabled: true }),
    create: vi.fn(),
    save: vi.fn(),
  } as any;
  const contactNameRepository = { save: vi.fn().mockResolvedValue(undefined) } as any;
  const automationQueue = { enqueue: vi.fn().mockResolvedValue(undefined) } as unknown as WhatsappAutomationQueueService;

  const service = new WhatsappWebhookService(
    tenantResolver,
    whatsappSendService,
    chatsService,
    localService,
    chatMediaService,
    excludedPhoneRepository,
    whatsappSettingsRepository,
    contactNameRepository,
    automationQueue,
  );
  return {
    service,
    chatMediaService,
    whatsappSendService,
    chatsService,
    excludedPhoneRepository,
    whatsappSettingsRepository,
    automationQueue,
  };
}

const incoming = {
  phoneNumberId: "phone-1",
  from: "5215500000000",
  messageId: "wamid.in-1",
  body: "Hola (ref: 7F3K2A9B)",
  messageType: "text" as const,
};
const READY_REPLY = "Nota #1042 de Celulares Pérez:\n¡Tu equipo ya está listo! Ya puedes pasar por él.";

afterEach(() => {
  vi.clearAllMocks();
});

describe("WhatsappWebhookService.handleIncomingMessage", () => {
  it("no hace nada si el mensaje no se puede atribuir a un tenant", async () => {
    const { service, chatsService, whatsappSendService } = makeDeps(null);

    await service.handleIncomingMessage(incoming);

    expect(chatsService.recordMessage).not.toHaveBeenCalled();
    expect(whatsappSendService.sendFreeText).not.toHaveBeenCalled();
  });

  it("con ref valido guarda el entrante, responde el estado y guarda la respuesta", async () => {
    const { service, chatsService, whatsappSendService } = makeDeps();
    vi.mocked(humanModeService.isActive).mockResolvedValue(false);

    await service.handleIncomingMessage({ ...incoming, contactName: "Ana" });

    expect(chatsService.recordMessage).toHaveBeenNthCalledWith(1, {
      contactPhone: "5215500000000",
      direction: "inbound",
      sender: "customer",
      body: "Hola (ref: 7F3K2A9B)",
      waMessageId: "wamid.in-1",
      repairNoteId: "note-9",
      messageType: "text",
      mediaKey: null,
      mediaMime: null,
      mediaSize: null,
      locationLat: null,
      locationLng: null,
    });
    expect(whatsappSendService.sendFreeText).toHaveBeenCalledWith(
      "phone-1",
      "token-1",
      "5215500000000",
      READY_REPLY,
      expect.any(Date),
    );
    expect(chatsService.recordMessage).toHaveBeenNthCalledWith(2, {
      contactPhone: "5215500000000",
      direction: "outbound",
      sender: "ai",
      body: READY_REPLY,
      waMessageId: "wamid.out-1",
      repairNoteId: "note-9",
    });
  });

  it("la respuesta nunca incluye datos del cliente ni saldo", async () => {
    const { service, whatsappSendService } = makeDeps();
    vi.mocked(humanModeService.isActive).mockResolvedValue(false);

    await service.handleIncomingMessage({ ...incoming, contactName: "Ana" });

    const sent = vi.mocked(whatsappSendService.sendFreeText).mock.calls[0]![3];
    expect(sent).not.toMatch(/Ana|\$|saldo/i);
  });

  it("sin nota (sin ref o ref inexistente) guarda el mensaje pero no responde", async () => {
    const { service, chatsService, whatsappSendService } = makeDeps({ account, note: null });
    vi.mocked(humanModeService.isActive).mockResolvedValue(false);

    await service.handleIncomingMessage({ ...incoming, body: "hola" });

    expect(chatsService.recordMessage).toHaveBeenCalledTimes(1);
    expect(whatsappSendService.sendFreeText).not.toHaveBeenCalled();
  });

  it("un estado desconocido no genera respuesta", async () => {
    const { service, whatsappSendService } = makeDeps({ account, note: { ...note, status: "raro" } as RepairNote });
    vi.mocked(humanModeService.isActive).mockResolvedValue(false);

    await service.handleIncomingMessage(incoming);

    expect(whatsappSendService.sendFreeText).not.toHaveBeenCalled();
  });

  it("un teléfono excluido no se guarda ni recibe respuesta", async () => {
    const { service, excludedPhoneRepository, chatsService, whatsappSendService } = makeDeps();
    vi.mocked(excludedPhoneRepository.exists).mockResolvedValue(true);

    await service.handleIncomingMessage(incoming);

    expect(chatsService.recordMessage).not.toHaveBeenCalled();
    expect(whatsappSendService.sendFreeText).not.toHaveBeenCalled();
  });

  it("con las respuestas automáticas apagadas guarda el mensaje y no responde", async () => {
    const { service, whatsappSettingsRepository, chatsService, whatsappSendService } = makeDeps();
    vi.mocked(whatsappSettingsRepository.findOneBy).mockResolvedValue({ tenantId: "tenant-1", aiRepliesEnabled: false });

    await service.handleIncomingMessage(incoming);

    expect(chatsService.recordMessage).toHaveBeenCalledTimes(1);
    expect(whatsappSendService.sendFreeText).not.toHaveBeenCalled();
  });

  it("en modo humano guarda el mensaje (la ventana de 24h sigue abierta) y no responde", async () => {
    const { service, chatsService, whatsappSendService } = makeDeps();
    vi.mocked(humanModeService.isActive).mockResolvedValue(true);

    await service.handleIncomingMessage(incoming);

    expect(chatsService.recordMessage).toHaveBeenCalledWith(expect.objectContaining({ direction: "inbound" }));
    expect(whatsappSendService.sendFreeText).not.toHaveBeenCalled();
  });
});

describe("WhatsappWebhookService respuesta de estado idempotente", () => {
  it("envia la respuesta de estado con una clave derivada del wamid entrante", async () => {
    const { service, whatsappSendService } = makeDeps();
    vi.mocked(humanModeService.isActive).mockResolvedValue(false);

    await service.handleIncomingMessage(incoming);

    expect(whatsappSendService.sendFreeTextOnce).toHaveBeenCalledWith(
      "status:wamid.in-1",
      "phone-1",
      "token-1",
      "5215500000000",
      READY_REPLY,
      expect.any(Date),
    );
  });
});

describe("WhatsappWebhookService reenvio a n8n", () => {
  it("encola el texto con el tenant y la cuenta resueltos por el API, sin el token", async () => {
    const { service, automationQueue } = makeDeps({ account, note: null });
    vi.mocked(humanModeService.isActive).mockResolvedValue(false);

    await service.handleIncomingMessage({ ...incoming, body: "hola" });

    expect(automationQueue.enqueue).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      accountId: "acc-1",
      from: "5215500000000",
      body: "hola",
      repairNoteId: null,
      sourceMessageId: "wamid.in-1",
    });
  });

  it("con ref valido encola con la nota y ademas responde el estado", async () => {
    const { service, automationQueue, whatsappSendService } = makeDeps();
    vi.mocked(humanModeService.isActive).mockResolvedValue(false);

    await service.handleIncomingMessage(incoming);

    expect(automationQueue.enqueue).toHaveBeenCalledWith(expect.objectContaining({ repairNoteId: "note-9" }));
    expect(whatsappSendService.sendFreeText).toHaveBeenCalledTimes(1);
  });

  it("no encola en modo humano, con respuestas apagadas ni sin texto", async () => {
    const human = makeDeps({ account, note: null });
    vi.mocked(humanModeService.isActive).mockResolvedValue(true);
    await human.service.handleIncomingMessage({ ...incoming, body: "hola" });

    vi.mocked(humanModeService.isActive).mockResolvedValue(false);
    const off = makeDeps({ account, note: null });
    vi.mocked(off.whatsappSettingsRepository.findOneBy).mockResolvedValue({ tenantId: "tenant-1", aiRepliesEnabled: false });
    await off.service.handleIncomingMessage({ ...incoming, body: "hola" });

    const empty = makeDeps({ account, note: null });
    await empty.service.handleIncomingMessage({ ...incoming, body: "  " });

    expect(human.automationQueue.enqueue).not.toHaveBeenCalled();
    expect(off.automationQueue.enqueue).not.toHaveBeenCalled();
    expect(empty.automationQueue.enqueue).not.toHaveBeenCalled();
  });
});

describe("WhatsappWebhookService mensajes que no son texto", () => {
  it("guarda una foto descargada con su clave de archivo y no responde", async () => {
    const { service, chatMediaService, chatsService, whatsappSendService } = makeDeps({ account, note: null });
    vi.mocked(humanModeService.isActive).mockResolvedValue(false);

    await service.handleIncomingMessage({
      phoneNumberId: "phone-1",
      from: "5215500000000",
      messageId: "wamid.in-1",
      body: "mi pantalla",
      messageType: "image",
      media: { id: "media-1", mimeType: "image/jpeg" },
    });

    expect(chatMediaService.ingest).toHaveBeenCalledWith(
      expect.objectContaining({ mediaId: "media-1", waMessageId: "wamid.in-1", contactPhone: "5215500000000", accessToken: "token-1" }),
    );
    expect(chatsService.recordMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        messageType: "image",
        body: "mi pantalla",
        mediaKey: "tenants/tenant-1/chat/5215500000000/wamid.in-1.jpg",
        mediaMime: "image/jpeg",
        mediaSize: 10,
      }),
    );
    expect(whatsappSendService.sendFreeText).not.toHaveBeenCalled();
  });

  it("si el archivo no se pudo guardar, registra el mensaje con su tipo y sin archivo", async () => {
    const { service, chatMediaService, chatsService } = makeDeps({ account, note: null });
    vi.mocked(chatMediaService.ingest).mockResolvedValue(null);

    await service.handleIncomingMessage({
      phoneNumberId: "phone-1",
      from: "5215500000000",
      messageId: "wamid.in-2",
      body: "",
      messageType: "audio",
      media: { id: "media-2" },
    });

    expect(chatsService.recordMessage).toHaveBeenCalledWith(
      expect.objectContaining({ messageType: "audio", mediaKey: null, mediaMime: null, mediaSize: null }),
    );
  });

  it("guarda una ubicacion con latitud y longitud, sin descargar nada", async () => {
    const { service, chatMediaService, chatsService } = makeDeps({ account, note: null });

    await service.handleIncomingMessage({
      phoneNumberId: "phone-1",
      from: "5215500000000",
      messageId: "wamid.in-3",
      body: "",
      messageType: "location",
      location: { lat: "19.432600", lng: "-99.133200" },
    });

    expect(chatMediaService.ingest).not.toHaveBeenCalled();
    expect(chatsService.recordMessage).toHaveBeenCalledWith(
      expect.objectContaining({ messageType: "location", locationLat: "19.432600", locationLng: "-99.133200", mediaKey: null }),
    );
  });

  it("un teléfono excluido no descarga ni guarda archivos", async () => {
    const { service, excludedPhoneRepository, chatMediaService, chatsService } = makeDeps({ account, note: null });
    vi.mocked(excludedPhoneRepository.exists).mockResolvedValue(true);

    await service.handleIncomingMessage({
      phoneNumberId: "phone-1",
      from: "5215500000000",
      messageId: "wamid.in-4",
      body: "",
      messageType: "image",
      media: { id: "media-4" },
    });

    expect(chatMediaService.ingest).not.toHaveBeenCalled();
    expect(chatsService.recordMessage).not.toHaveBeenCalled();
  });
});
