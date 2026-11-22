import { singleton } from "tsyringe";
import { NotificationDao } from "../daos/notification.dao.js";
import { Notification, NotificationType } from "../entities/notification.entity.js";
import { ChatMessageDao } from "../../chats/daos/chat-message.dao.js";
import { normalizePhone } from "../../chats/helpers/chats.helpers.js";
import { can, currentUserId } from "../../../identity/authz/access.js";

@singleton()
export class NotificationService {
  constructor(
    private dao: NotificationDao,
    private chatMessageDao: ChatMessageDao,
  ) {}

  // Las notificaciones son de una conversación: quien solo ve las suyas (chats.read.own)
  // recibe solo las de conversaciones de sus notas. null = sin filtro.
  private async visiblePhones(): Promise<Set<string> | null> {
    const userId = currentUserId();
    if (can("chats.read") || !userId) return null;
    return this.chatMessageDao.findPhonesOfAssignedNotes(userId);
  }

  async getAll(unreadOnly = false): Promise<Notification[]> {
    const [notifications, phones] = await Promise.all([this.dao.findAllOrdered(unreadOnly), this.visiblePhones()]);
    return phones ? notifications.filter((n) => phones.has(normalizePhone(n.phone))) : notifications;
  }

  async create(data: {
    type: NotificationType;
    sessionId: string;
    phone: string;
    contactName?: string;
  }): Promise<Notification> {
    return this.dao.create({ ...data, read: false });
  }

  async markRead(id: number): Promise<Notification | null> {
    const phones = await this.visiblePhones();
    if (phones) {
      const notification = await this.dao.findById(id);
      if (!notification || !phones.has(normalizePhone(notification.phone))) return null;
    }
    return this.dao.update(id, { read: true });
  }

  async markAllRead(): Promise<void> {
    const phones = await this.visiblePhones();
    if (!phones) return this.dao.markAllRead();
    const unread = await this.dao.findAllOrdered(true);
    await Promise.all(
      unread.filter((n) => phones.has(normalizePhone(n.phone))).map((n) => this.dao.update(n.id, { read: true })),
    );
  }
}
