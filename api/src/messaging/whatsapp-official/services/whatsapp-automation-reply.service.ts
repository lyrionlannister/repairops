import { singleton } from "tsyringe";
import { WhatsappAccountDao } from "../daos/whatsapp-account.dao.js";
import { WhatsappSendService } from "./whatsapp-send.service.js";
import { ChatsService } from "../../chats/services/chats.service.js";
import { ChatAutomationService } from "../../chats/services/chat-automation.service.js";

export type AutomationReplyRequest = {
  accountId: string;
  from: string;
  body: string;
  repairNoteId: string | null;
};

@singleton()
export class WhatsappAutomationReplyService {
  constructor(
    private whatsappAccountDao: WhatsappAccountDao,
    private whatsappSendService: WhatsappSendService,
    private chatsService: ChatsService,
    private chatAutomationService: ChatAutomationService,
  ) {}

  async reply(request: AutomationReplyRequest): Promise<void> {
    const account = await this.whatsappAccountDao.findById(request.accountId);
    if (!account) return;

    const response = await this.chatAutomationService.send({
      tenantId: account.tenantId,
      from: request.from,
      body: request.body,
    });
    const reply = response?.reply?.trim();
    if (!reply) return;

    const waMessageId = await this.whatsappSendService.sendFreeText(
      account.phoneNumberId,
      account.accessToken,
      request.from,
      reply,
      new Date(),
    );
    await this.chatsService.recordMessage({
      contactPhone: request.from,
      direction: "outbound",
      sender: "ai",
      body: reply,
      waMessageId,
      repairNoteId: request.repairNoteId,
    });
  }
}
