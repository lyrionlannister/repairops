import { LessThan, Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";
import { ChatDirection, ChatMessage, ChatSender } from "../entities/chat-message.entity.js";

export interface ConversationRow {
  sessionId: string;
  lastId: number;
  messageCount: number;
  lastContent: string;
  lastDirection: ChatDirection;
}

export interface RecordChatMessageInput {
  contactPhone: string;
  direction: ChatDirection;
  sender: ChatSender;
  body: string;
  waMessageId?: string | null;
}

// Un solo statement: el mensaje y sus contadores diarios (chat_daily_stats,
// chat_daily_contacts) se escriben juntos o ninguno. Si el wa_message_id ya
// existe en el tenant (Meta reentrega webhooks), `ins` no devuelve fila y los
// contadores tampoco se tocan.
const RECORD_SQL = `
  WITH ins AS (
    INSERT INTO chat_messages (tenant_id, contact_phone, direction, sender, body, wa_message_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (tenant_id, wa_message_id) WHERE wa_message_id IS NOT NULL DO NOTHING
    RETURNING created_at
  ), stat AS (
    INSERT INTO chat_daily_stats (tenant_id, day, messages, last_message_at)
    SELECT $1, (created_at AT TIME ZONE 'UTC')::date, 1, created_at FROM ins
    ON CONFLICT (tenant_id, day) DO UPDATE
      SET messages = chat_daily_stats.messages + 1, last_message_at = EXCLUDED.last_message_at
    RETURNING 1
  )
  INSERT INTO chat_daily_contacts (tenant_id, day, contact_phone)
  SELECT $1, (created_at AT TIME ZONE 'UTC')::date, $2 FROM ins
  ON CONFLICT DO NOTHING
`;

@singleton()
export class ChatMessageDao extends TenantScopedDao<ChatMessage> {
  constructor(@inject(repositoryToken(ChatMessage)) repository: Repository<ChatMessage>) {
    super(repository);
  }

  async record(input: RecordChatMessageInput): Promise<void> {
    await this.repository.query(RECORD_SQL, [
      this.currentTenantId(),
      input.contactPhone,
      input.direction,
      input.sender,
      input.body,
      input.waMessageId ?? null,
    ]);
  }

  async getConversations(): Promise<ConversationRow[]> {
    return this.repository.query(
      `
      SELECT
        h.contact_phone                AS "sessionId",
        MAX(h.id)::int                 AS "lastId",
        COUNT(*)::int                  AS "messageCount",
        (SELECT s.body      FROM chat_messages s WHERE s.tenant_id = $1 AND s.contact_phone = h.contact_phone ORDER BY s.id DESC LIMIT 1) AS "lastContent",
        (SELECT s.direction FROM chat_messages s WHERE s.tenant_id = $1 AND s.contact_phone = h.contact_phone ORDER BY s.id DESC LIMIT 1) AS "lastDirection"
      FROM chat_messages h
      WHERE h.tenant_id = $1
      GROUP BY h.contact_phone
      ORDER BY "lastId" DESC
      `,
      [this.currentTenantId()],
    );
  }

  async getMessagesByContact(contactPhone: string): Promise<ChatMessage[]> {
    return this.scoped().andWhere("entity.contactPhone = :contactPhone", { contactPhone }).orderBy("entity.id", "ASC").getMany();
  }

  // Gate de la ventana de 24h de WhatsappSendService.sendFreeText: solo el
  // ultimo mensaje del CLIENTE abre la ventana, no una respuesta nuestra.
  async findLastInboundAt(contactPhone: string): Promise<Date | null> {
    const row = await this.scoped()
      .select("MAX(entity.createdAt)", "lastAt")
      .andWhere("entity.contactPhone = :contactPhone AND entity.direction = 'inbound'", { contactPhone })
      .getRawOne<{ lastAt: Date | null }>();
    return row?.lastAt ? new Date(row.lastAt) : null;
  }

  // Operacion de sistema (todos los tenants), la corre ChatRetentionService.
  async purgeBefore(cutoff: Date): Promise<number> {
    const result = await this.repository.delete({ createdAt: LessThan(cutoff) });
    return result.affected ?? 0;
  }
}
