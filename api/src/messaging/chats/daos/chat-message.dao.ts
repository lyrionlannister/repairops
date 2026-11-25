import { LessThan, Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";
import {
  ChatDirection,
  ChatMessage,
  ChatMessageType,
  ChatSender,
} from "../entities/chat-message.entity.js";

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
  repairNoteId?: string | null;
  messageType?: ChatMessageType;
  mediaKey?: string | null;
  mediaMime?: string | null;
  mediaSize?: number | null;
  locationLat?: string | null;
  locationLng?: string | null;
}

// Un solo statement: el mensaje y sus contadores diarios (chat_daily_stats,
// chat_daily_contacts) se escriben juntos o ninguno. Si el wa_message_id ya
// existe en el tenant (Meta reentrega webhooks), `ins` no devuelve fila y los
// contadores tampoco se tocan. Postgres ejecuta `stat` y `contact` igual
// (son CTEs con INSERT, corren siempre) aunque el SELECT final solo lea de
// `ins` -- asi el caller sabe si de verdad se grabo una fila nueva (para
// avisar por socket) sin perder la atomicidad original.
const RECORD_SQL = `
  WITH ins AS (
    INSERT INTO chat_messages (tenant_id, contact_phone, direction, sender, body, wa_message_id, repair_note_id,
                               message_type, media_key, media_mime, media_size, location_lat, location_lng)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT (tenant_id, wa_message_id) WHERE wa_message_id IS NOT NULL DO NOTHING
    RETURNING public_id, contact_phone, direction, body, message_type, media_key, media_mime, media_size, location_lat, location_lng, created_at
  ), stat AS (
    INSERT INTO chat_daily_stats (tenant_id, day, messages, last_message_at)
    SELECT $1, (created_at AT TIME ZONE COALESCE((SELECT zona_horaria FROM local_config WHERE tenant_id = $1), 'America/Mexico_City'))::date, 1, created_at FROM ins
    ON CONFLICT (tenant_id, day) DO UPDATE
      SET messages = chat_daily_stats.messages + 1, last_message_at = EXCLUDED.last_message_at
    RETURNING 1
  ), contact AS (
    INSERT INTO chat_daily_contacts (tenant_id, day, contact_phone)
    SELECT $1, (created_at AT TIME ZONE COALESCE((SELECT zona_horaria FROM local_config WHERE tenant_id = $1), 'America/Mexico_City'))::date, $2 FROM ins
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT public_id AS "publicId", contact_phone AS "contactPhone", direction, body,
         message_type AS "messageType", media_key AS "mediaKey", media_mime AS "mediaMime",
         media_size AS "mediaSize", location_lat AS "locationLat", location_lng AS "locationLng"
  FROM ins
`;

export interface RecordedChatMessage {
  publicId: string;
  contactPhone: string;
  direction: ChatDirection;
  body: string;
  messageType: ChatMessageType;
  mediaKey: string | null;
  mediaMime: string | null;
  mediaSize: number | null;
  locationLat: string | null;
  locationLng: string | null;
}

@singleton()
export class ChatMessageDao extends TenantScopedDao<ChatMessage> {
  constructor(@inject(repositoryToken(ChatMessage)) repository: Repository<ChatMessage>) {
    super(repository);
  }

  // null cuando el wa_message_id ya existia en el tenant (Meta reentrego el
  // webhook): no hubo fila nueva, así que el caller no debe avisar por socket.
  async record(input: RecordChatMessageInput): Promise<RecordedChatMessage | null> {
    const rows: RecordedChatMessage[] = await this.repository.query(RECORD_SQL, [
      this.currentTenantId(),
      input.contactPhone,
      input.direction,
      input.sender,
      input.body,
      input.waMessageId ?? null,
      input.repairNoteId ?? null,
      input.messageType ?? "text",
      input.mediaKey ?? null,
      input.mediaMime ?? null,
      input.mediaSize ?? null,
      input.locationLat ?? null,
      input.locationLng ?? null,
    ]);
    return rows[0] ?? null;
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

  // Una conversación es de un técnico si la nota más reciente referenciada en sus
  // mensajes (repair_note_id, sale del QR) está asignada a él. Si el cliente escanea
  // después el QR de otra nota, la conversación pasa al técnico de esa nota.
  async findPhonesOfAssignedNotes(userId: string): Promise<Set<string>> {
    const rows: Array<{ phone: string }> = await this.repository.query(
      `SELECT latest.contact_phone AS phone
       FROM (
         SELECT DISTINCT ON (m.contact_phone) m.contact_phone, m.repair_note_id
         FROM chat_messages m
         WHERE m.tenant_id = $1 AND m.repair_note_id IS NOT NULL
         ORDER BY m.contact_phone, m.id DESC
       ) latest
       JOIN repair_notes rn ON rn.id = latest.repair_note_id AND rn.tenant_id = $1
       WHERE rn.id_empleado_asignado = $2`,
      [this.currentTenantId(), userId],
    );
    return new Set(rows.map((row) => row.phone));
  }

  async getMessagesByContact(contactPhone: string): Promise<ChatMessage[]> {
    return this.scoped()
      .andWhere("entity.contactPhone = :contactPhone", { contactPhone })
      .orderBy("entity.id", "ASC")
      .getMany();
  }

  async findMediaMessage(contactPhone: string, publicId: string): Promise<ChatMessage | null> {
    return this.scoped()
      .andWhere(
        "entity.contactPhone = :contactPhone AND entity.publicId = :publicId AND entity.mediaKey IS NOT NULL",
        {
          contactPhone,
          publicId,
        },
      )
      .getOne();
  }

  // Gate de la ventana de 24h de WhatsappSendService.sendFreeText: solo el
  // ultimo mensaje del CLIENTE abre la ventana, no una respuesta nuestra.
  async findLastInboundAt(contactPhone: string): Promise<Date | null> {
    const row = await this.scoped()
      .select("MAX(entity.createdAt)", "lastAt")
      .andWhere("entity.contactPhone = :contactPhone AND entity.direction = 'inbound'", {
        contactPhone,
      })
      .getRawOne<{ lastAt: Date | null }>();
    return row?.lastAt ? new Date(row.lastAt) : null;
  }

  // Mismo gate que findLastInboundAt, pero por nota en vez de por numero: a
  // quien le escribio por ultimo sobre ESTA nota (el cliente puede escribir
  // desde cualquier telefono, el suyo puede estar siendo reparado).
  async findLastInboundForNote(
    repairNoteId: string,
  ): Promise<{ contactPhone: string; createdAt: Date } | null> {
    const row = await this.scoped()
      .select("entity.contactPhone", "contactPhone")
      .addSelect("entity.createdAt", "createdAt")
      .andWhere("entity.repairNoteId = :repairNoteId AND entity.direction = 'inbound'", {
        repairNoteId,
      })
      .orderBy("entity.id", "DESC")
      .limit(1)
      .getRawOne<{ contactPhone: string; createdAt: Date }>();
    return row ? { contactPhone: row.contactPhone, createdAt: new Date(row.createdAt) } : null;
  }

  // Operacion de sistema (todos los tenants), la corre ChatRetentionService.
  async purgeBefore(cutoff: Date): Promise<number> {
    const result = await this.repository.delete({ createdAt: LessThan(cutoff) });
    return result.affected ?? 0;
  }
}
