import { singleton, inject } from "tsyringe";
import { Repository } from "typeorm";
import { ChatMessageDao } from "../daos/chat-message.dao.js";
import { ChatStatsDao, ConversationCountPoint } from "../daos/chat-stats.dao.js";
import { ContactName } from "../entities/contact-name.entity.js";
import { ChatDirection, ChatMessageType, ChatSender } from "../entities/chat-message.entity.js";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { normalizePhone, toConversationDto, toMessageDto } from "../helpers/chats.helpers.js";
import { ConversationDto, MessageDto } from "../types/chats.types.js";
import { can, currentUserId } from "../../../identity/authz/access.js";

export interface RecordMessageInput {
  contactPhone: string;
  direction: ChatDirection;
  sender: ChatSender;
  body: string;
  waMessageId?: string | null;
  repairNoteId?: string | null;
  messageType?: ChatMessageType;
  mediaKey?: string | null;
  mediaMime?: string | null;
  mediaSize?: number | null;
  locationLat?: string | null;
  locationLng?: string | null;
}

@singleton()
export class ChatsService {
  constructor(
    private chatMessageDao: ChatMessageDao,
    private chatStatsDao: ChatStatsDao,
    @inject(repositoryToken(ContactName)) private contactNameRepository: Repository<ContactName>,
  ) {}

  async recordMessage(input: RecordMessageInput): Promise<void> {
    await this.chatMessageDao.record({ ...input, contactPhone: normalizePhone(input.contactPhone) });
  }

  async findMediaMessage(sessionId: string, publicId: string) {
    return this.chatMessageDao.findMediaMessage(normalizePhone(sessionId), publicId);
  }

  // read: ver la conversación y sus medios; reply: responder o tomar el control.
  // Con el permiso completo, cualquiera; con el .own, solo las de sus notas asignadas.
  async canAccess(sessionId: string, action: "read" | "reply"): Promise<boolean> {
    const [full, own] = action === "read" ? (["chats.read", "chats.read.own"] as const) : (["chats.reply", "chats.reply.own"] as const);
    if (can(full)) return true;
    const userId = currentUserId();
    if (!can(own) || !userId) return false;
    return (await this.chatMessageDao.findPhonesOfAssignedNotes(userId)).has(normalizePhone(sessionId));
  }

  async getConversations(): Promise<ConversationDto[]> {
    const userId = currentUserId();
    const ownPhones = !can("chats.read") && userId ? await this.chatMessageDao.findPhonesOfAssignedNotes(userId) : null;
    const rows = (await this.chatMessageDao.getConversations()).filter((row) => !ownPhones || ownPhones.has(row.sessionId));
    const contactNames = await this.contactNameRepository.find({ where: { tenantId: getCurrentTenantId() } });
    const nameMap = new Map(contactNames.map((cn) => [cn.phone, cn.name]));

    return rows.map((row) => toConversationDto(row, nameMap));
  }

  async getMessages(sessionId: string): Promise<MessageDto[]> {
    const entries = await this.chatMessageDao.getMessagesByContact(normalizePhone(sessionId));
    return entries.map((entry) => toMessageDto(entry));
  }

  async getConversationCountsByDay(): Promise<ConversationCountPoint[]> {
    return this.chatStatsDao.getCountsByDay();
  }

  async getConversationCountsByMonth(year: number): Promise<ConversationCountPoint[]> {
    return this.chatStatsDao.getCountsByMonth(year);
  }

  async getWeekSessionCount(): Promise<number> {
    return this.chatStatsDao.getWeekContactCount();
  }

  async getLastInteractionAt(): Promise<string | null> {
    return this.chatStatsDao.getLastMessageAt();
  }

  async getLastInboundAt(sessionId: string): Promise<Date | null> {
    return this.chatMessageDao.findLastInboundAt(normalizePhone(sessionId));
  }
}
