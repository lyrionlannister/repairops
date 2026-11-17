import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";

// Un contacto activo por tenant y dia: permite contar conversaciones
// distintas por semana y mes sin conservar los mensajes.
@Entity("chat_daily_contacts")
export class ChatDailyContact {
  @PrimaryColumn({ type: "bigint", name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_chat_daily_contacts_tenant" })
  tenant?: Tenant;

  @PrimaryColumn({ type: "date" })
  day!: string;

  @PrimaryColumn({ type: "varchar", length: 32, name: "contact_phone" })
  contactPhone!: string;
}
