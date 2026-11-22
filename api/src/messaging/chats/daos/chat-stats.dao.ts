import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { ChatDailyStat } from "../entities/chat-daily-stat.entity.js";

export interface ConversationCountPoint {
  bucket: string;
  count: number;
}

// Lecturas de las estadisticas de chat sobre los contadores, no sobre
// chat_messages (que solo conserva 24h). Todas filtran por el tenant del
// contexto.
// El dia de cada contador y "hoy"/semana se calculan en la zona horaria del
// tenant (local_config.zona_horaria).
@singleton()
export class ChatStatsDao {
  constructor(@inject(repositoryToken(ChatDailyStat)) private repository: Repository<ChatDailyStat>) {}

  async getCountsByDay(): Promise<ConversationCountPoint[]> {
    return this.repository.query<ConversationCountPoint[]>(
      `
      SELECT
        TO_CHAR(d, 'YYYY-MM-DD') AS bucket,
        COALESCE(s.messages, 0)::int AS count
      FROM generate_series(
        (now() AT TIME ZONE COALESCE((SELECT zona_horaria FROM local_config WHERE tenant_id = $1), 'America/Mexico_City'))::date - 29,
        (now() AT TIME ZONE COALESCE((SELECT zona_horaria FROM local_config WHERE tenant_id = $1), 'America/Mexico_City'))::date,
        INTERVAL '1 day'
      ) AS d
      LEFT JOIN chat_daily_stats s ON s.tenant_id = $1 AND s.day = d::date
      ORDER BY d ASC
      `,
      [getCurrentTenantId()],
    );
  }

  async getCountsByMonth(year: number): Promise<ConversationCountPoint[]> {
    return this.repository.query<ConversationCountPoint[]>(
      `
      SELECT
        TO_CHAR(m, 'YYYY-MM') AS bucket,
        COALESCE(COUNT(DISTINCT c.contact_phone), 0)::int AS count
      FROM generate_series(
        MAKE_DATE($2, 1, 1)::timestamp,
        MAKE_DATE($2, 12, 1)::timestamp,
        INTERVAL '1 month'
      ) AS m
      LEFT JOIN chat_daily_contacts c
        ON c.tenant_id = $1 AND DATE_TRUNC('month', c.day::timestamp) = m
      GROUP BY m
      ORDER BY m ASC
      `,
      [getCurrentTenantId(), year],
    );
  }

  async getWeekContactCount(): Promise<number> {
    const result = await this.repository.query<Array<{ count: number }>>(
      `
      SELECT COUNT(DISTINCT contact_phone)::int AS count
      FROM chat_daily_contacts
      WHERE tenant_id = $1 AND day >= DATE_TRUNC('week', now() AT TIME ZONE COALESCE((SELECT zona_horaria FROM local_config WHERE tenant_id = $1), 'America/Mexico_City'))::date
      `,
      [getCurrentTenantId()],
    );
    return result[0]?.count ?? 0;
  }

  async getLastMessageAt(): Promise<string | null> {
    const result = await this.repository.query<Array<{ lastAt: string | null }>>(
      `SELECT MAX(last_message_at) AS "lastAt" FROM chat_daily_stats WHERE tenant_id = $1`,
      [getCurrentTenantId()],
    );
    return result[0]?.lastAt ?? null;
  }

  // Operacion de sistema (todos los tenants), la corre ChatRetentionService.
  async purgeBefore(cutoffDay: string): Promise<void> {
    await this.repository.query(`DELETE FROM chat_daily_stats WHERE day < $1`, [cutoffDay]);
    await this.repository.query(`DELETE FROM chat_daily_contacts WHERE day < $1`, [cutoffDay]);
  }
}
