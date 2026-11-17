import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";

// Contador de mensajes por tenant y dia. Sobrevive al purgado de 24h de
// chat_messages: es de donde salen las graficas del dashboard.
// shortcut: el dia se calcula en UTC; pasa a zona horaria del tenant cuando
// el modulo dashboard agregue Local.timezone.
@Entity("chat_daily_stats")
export class ChatDailyStat {
  @PrimaryColumn({ type: "bigint", name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_chat_daily_stats_tenant" })
  tenant?: Tenant;

  @PrimaryColumn({ type: "date" })
  day!: string;

  @Column({ type: "int", default: 0 })
  messages!: number;

  @Column({ type: "timestamptz", name: "last_message_at" })
  lastMessageAt!: Date;
}
