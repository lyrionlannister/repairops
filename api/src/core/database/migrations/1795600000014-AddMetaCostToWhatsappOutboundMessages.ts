import { MigrationInterface, QueryRunner } from "typeorm";

// Costo real de Meta por mensaje saliente, resuelto desde el webhook de
// status (value.statuses[].pricing) contra el catálogo whatsapp_meta_pricing
// -- nulo hasta que el status con pricing llegue (no todos lo traen: Meta
// solo lo manda cuando billable=true). Índice en meta_message_id: el webhook
// resuelve el tenant por ese id, cruzando todos los tenants (igual criterio
// que stripe_customer_id en subscriptions).
export class AddMetaCostToWhatsappOutboundMessages1795600000014 implements MigrationInterface {
  name = "AddMetaCostToWhatsappOutboundMessages1795600000014";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "whatsapp_outbound_messages"
          ADD COLUMN "conversation_category" character varying(30),
          ADD COLUMN "meta_cost_usd" numeric(10,4),
          ADD COLUMN "billable" boolean
        `);
    await queryRunner.query(`
          ALTER TABLE "whatsapp_outbound_messages"
          ADD CONSTRAINT "CHK_whatsapp_outbound_messages_category" CHECK ("conversation_category" IS NULL OR "conversation_category" IN ('marketing', 'utility', 'authentication', 'service'))
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_whatsapp_outbound_messages_meta_message_id" ON "whatsapp_outbound_messages" ("meta_message_id")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          DROP INDEX IF EXISTS "IDX_whatsapp_outbound_messages_meta_message_id"
        `);
    await queryRunner.query(`
          ALTER TABLE "whatsapp_outbound_messages" DROP CONSTRAINT IF EXISTS "CHK_whatsapp_outbound_messages_category"
        `);
    await queryRunner.query(`
          ALTER TABLE "whatsapp_outbound_messages"
          DROP COLUMN "conversation_category",
          DROP COLUMN "meta_cost_usd",
          DROP COLUMN "billable"
        `);
  }
}
