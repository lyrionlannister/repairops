import { describe, expect, it, vi, afterEach } from "vitest";
import { WhatsappAutomationReplyService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-automation-reply.service.js";
import type { WhatsappAccountDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-account.dao.js";
import type { WhatsappSendService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-send.service.js";
import type { ChatsService } from "../../../../src/messaging/chats/services/chats.service.js";
import type { ChatAutomationService } from "../../../../src/messaging/chats/services/chat-automation.service.js";
import type { WhatsappAccount } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-account.entity.js";
import { mockEntity } from "../../../support/mock-entity.js";

const account = mockEntity<WhatsappAccount>({
  id: "acc-1",
  tenantId: "tenant-1",
  phoneNumberId: "phone-1",
  accessToken: "token-1",
});
const request = {
  accountId: "acc-1",
  from: "5215500000000",
  body: "hola\nmi celular",
  repairNoteId: "note-9",
};

function build(found: WhatsappAccount | null, automationResponse: { reply?: string } | null) {
  const whatsappAccountDao = {
    findById: vi.fn().mockResolvedValue(found),
  } as unknown as WhatsappAccountDao;
  const whatsappSendService = {
    sendFreeText: vi.fn().mockResolvedValue("wamid.out-1"),
  } as unknown as WhatsappSendService;
  const chatsService = {
    recordMessage: vi.fn().mockResolvedValue(undefined),
  } as unknown as ChatsService;
  const chatAutomationService = {
    send: vi.fn().mockResolvedValue(automationResponse),
  } as unknown as ChatAutomationService;
  const service = new WhatsappAutomationReplyService(
    whatsappAccountDao,
    whatsappSendService,
    chatsService,
    chatAutomationService,
  );
  return { service, whatsappAccountDao, whatsappSendService, chatsService, chatAutomationService };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("WhatsappAutomationReplyService.reply", () => {
  it("manda a n8n el tenant de la cuenta, envia el reply y lo guarda como ai", async () => {
    const { service, chatAutomationService, whatsappSendService, chatsService } = build(account, {
      reply: "Hola, ¿en qué te ayudo?",
    });

    await service.reply(request);

    expect(chatAutomationService.send).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      from: "5215500000000",
      body: "hola\nmi celular",
    });
    expect(whatsappSendService.sendFreeText).toHaveBeenCalledWith(
      "phone-1",
      "token-1",
      "5215500000000",
      "Hola, ¿en qué te ayudo?",
      expect.any(Date),
    );
    expect(chatsService.recordMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        direction: "outbound",
        sender: "ai",
        waMessageId: "wamid.out-1",
        repairNoteId: "note-9",
      }),
    );
  });

  it("sin reply (mensaje absorbido por el buffer) no envia ni guarda nada", async () => {
    const { service, whatsappSendService, chatsService } = build(account, {});

    await service.reply(request);

    expect(whatsappSendService.sendFreeText).not.toHaveBeenCalled();
    expect(chatsService.recordMessage).not.toHaveBeenCalled();
  });

  it("una cuenta que no es del tenant en contexto (findById null) no llama a n8n ni envia", async () => {
    const { service, chatAutomationService, whatsappSendService } = build(null, { reply: "x" });

    await service.reply(request);

    expect(chatAutomationService.send).not.toHaveBeenCalled();
    expect(whatsappSendService.sendFreeText).not.toHaveBeenCalled();
  });
});
