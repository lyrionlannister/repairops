import { describe, expect, it, vi, afterEach } from "vitest";
import { WhatsappWebhookService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-webhook.service.js";
import type { WhatsappAccountDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-account.dao.js";
import type { WhatsappSendService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-send.service.js";
import type { ChatAutomationService } from "../../../../src/messaging/chats/services/chat-automation.service.js";
import type { ChatsService } from "../../../../src/messaging/chats/services/chats.service.js";
import type { WhatsappAccount } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-account.entity.js";
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

function makeDeps() {
  const whatsappAccountDao = { findByPhoneNumberId: vi.fn().mockResolvedValue(account) } as unknown as WhatsappAccountDao;
  const whatsappSendService = { sendFreeText: vi.fn().mockResolvedValue("wamid.out-1") } as unknown as WhatsappSendService;
  const chatAutomationService = { send: vi.fn() } as unknown as ChatAutomationService;
  const chatsService = { recordMessage: vi.fn().mockResolvedValue(undefined) } as unknown as ChatsService;
  const excludedPhoneRepository = { exists: vi.fn().mockResolvedValue(false) } as any;
  const whatsappSettingsRepository = {
    findOneBy: vi.fn().mockResolvedValue({ tenantId: "tenant-1", aiRepliesEnabled: true }),
    create: vi.fn(),
    save: vi.fn(),
  } as any;
  const contactNameRepository = { save: vi.fn().mockResolvedValue(undefined) } as any;

  const service = new WhatsappWebhookService(
    whatsappAccountDao,
    whatsappSendService,
    chatAutomationService,
    chatsService,
    excludedPhoneRepository,
    whatsappSettingsRepository,
    contactNameRepository,
  );

  return { service, whatsappAccountDao, whatsappSendService, chatAutomationService, chatsService, excludedPhoneRepository, whatsappSettingsRepository, contactNameRepository };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("WhatsappWebhookService.handleIncomingMessage", () => {
  it("does nothing for a phone_number_id with no matching account", async () => {
    const { service, whatsappAccountDao, chatAutomationService } = makeDeps();
    vi.mocked(whatsappAccountDao.findByPhoneNumberId).mockResolvedValue(null);

    await service.handleIncomingMessage({ phoneNumberId: "unknown", from: "521", body: "hola" });

    expect(chatAutomationService.send).not.toHaveBeenCalled();
  });

  it("ignores a message from an excluded phone without calling n8n", async () => {
    const { service, excludedPhoneRepository, chatAutomationService } = makeDeps();
    vi.mocked(excludedPhoneRepository.exists).mockResolvedValue(true);

    await service.handleIncomingMessage({ phoneNumberId: "phone-1", from: "5215500000000", body: "hola" });

    expect(chatAutomationService.send).not.toHaveBeenCalled();
  });

  it("skips the AI when the conversation is already in human mode", async () => {
    const { service, chatAutomationService } = makeDeps();
    vi.mocked(humanModeService.isActive).mockResolvedValue(true);

    await service.handleIncomingMessage({ phoneNumberId: "phone-1", from: "5215500000000", body: "hola" });

    expect(chatAutomationService.send).not.toHaveBeenCalled();
  });

  it("calls n8n and replies via Graph API when nothing blocks it", async () => {
    const { service, chatAutomationService, whatsappSendService } = makeDeps();
    vi.mocked(humanModeService.isActive).mockResolvedValue(false);
    vi.mocked(chatAutomationService.send).mockResolvedValue({ reply: "Hola, como te ayudo?" });

    await service.handleIncomingMessage({
      phoneNumberId: "phone-1",
      from: "5215500000000",
      body: "hola",
      contactName: "Ana",
    });

    expect(chatAutomationService.send).toHaveBeenCalledWith({ tenantId: "tenant-1", from: "5215500000000", body: "hola" });
    expect(whatsappSendService.sendFreeText).toHaveBeenCalledWith(
      "phone-1",
      "token-1",
      "5215500000000",
      "Hola, como te ayudo?",
      expect.any(Date),
    );
  });

  it("activates human mode when n8n asks to transfer, even without a reply", async () => {
    const { service, chatAutomationService, whatsappSendService } = makeDeps();
    vi.mocked(humanModeService.isActive).mockResolvedValue(false);
    vi.mocked(chatAutomationService.send).mockResolvedValue({ transferToHuman: true });

    await service.handleIncomingMessage({ phoneNumberId: "phone-1", from: "5215500000000", body: "quiero hablar con alguien" });

    expect(humanModeService.activate).toHaveBeenCalledWith("5215500000000", undefined);
    expect(whatsappSendService.sendFreeText).not.toHaveBeenCalled();
  });

  it("does not store a message from an excluded phone", async () => {
    const { service, excludedPhoneRepository, chatsService } = makeDeps();
    vi.mocked(excludedPhoneRepository.exists).mockResolvedValue(true);

    await service.handleIncomingMessage({ phoneNumberId: "phone-1", from: "5215500000000", body: "hola" });

    expect(chatsService.recordMessage).not.toHaveBeenCalled();
  });

  it("stores the inbound message even when AI replies are disabled", async () => {
    const { service, whatsappSettingsRepository, chatAutomationService, chatsService } = makeDeps();
    vi.mocked(whatsappSettingsRepository.findOneBy).mockResolvedValue({ tenantId: "tenant-1", aiRepliesEnabled: false });

    await service.handleIncomingMessage({ phoneNumberId: "phone-1", from: "5215500000000", messageId: "wamid.in-1", body: "hola" });

    expect(chatsService.recordMessage).toHaveBeenCalledWith({
      contactPhone: "5215500000000",
      direction: "inbound",
      sender: "customer",
      body: "hola",
      waMessageId: "wamid.in-1",
    });
    expect(chatAutomationService.send).not.toHaveBeenCalled();
  });

  it("stores the inbound message in human mode, so the 24h window stays open for the agent", async () => {
    const { service, chatsService, chatAutomationService } = makeDeps();
    vi.mocked(humanModeService.isActive).mockResolvedValue(true);

    await service.handleIncomingMessage({ phoneNumberId: "phone-1", from: "5215500000000", body: "sigues ahi?" });

    expect(chatsService.recordMessage).toHaveBeenCalledWith(expect.objectContaining({ direction: "inbound", body: "sigues ahi?" }));
    expect(chatAutomationService.send).not.toHaveBeenCalled();
  });

  it("stores the AI reply with the Meta message id after sending it", async () => {
    const { service, chatAutomationService, chatsService } = makeDeps();
    vi.mocked(humanModeService.isActive).mockResolvedValue(false);
    vi.mocked(chatAutomationService.send).mockResolvedValue({ reply: "Hola, como te ayudo?" });

    await service.handleIncomingMessage({ phoneNumberId: "phone-1", from: "5215500000000", body: "hola" });

    expect(chatsService.recordMessage).toHaveBeenLastCalledWith({
      contactPhone: "5215500000000",
      direction: "outbound",
      sender: "ai",
      body: "Hola, como te ayudo?",
      waMessageId: "wamid.out-1",
    });
  });
});
