import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWhatsappPendingNotifications1795600000005 implements MigrationInterface {
  name = "CreateWhatsappPendingNotifications1795600000005";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "whatsapp_pending_notifications" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuidv7(),
            "tenant_id" bigint NOT NULL,
            "repair_note_id" bigint NOT NULL,
            "contact_number" character varying(32) NOT NULL,
            "event_key" character varying(100) NOT NULL,
            "message_text" text NOT NULL,
            "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            "fecha_actualizacion" TIMESTAMP DEFAULT now(),
            CONSTRAINT "UQ_2085974b1b553a25c1f457fafa6" UNIQUE ("public_id"),
            CONSTRAINT "UQ_whatsapp_pending_notifications_nota" UNIQUE ("tenant_id", "repair_note_id"),
            CONSTRAINT "PK_bfcf91e61e1d01b4736b62691cf" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          ALTER TABLE "whatsapp_pending_notifications"
          ADD CONSTRAINT "FK_whatsapp_pending_notifications_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "whatsapp_pending_notifications"
          ADD CONSTRAINT "FK_whatsapp_pending_notifications_repair_note" FOREIGN KEY ("repair_note_id") REFERENCES "repair_notes" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "whatsapp_pending_notifications"
          DROP CONSTRAINT "FK_whatsapp_pending_notifications_repair_note"
        `);
    await queryRunner.query(`
          ALTER TABLE "whatsapp_pending_notifications"
          DROP CONSTRAINT "FK_whatsapp_pending_notifications_tenant"
        `);
    await queryRunner.query(`
          DROP TABLE "whatsapp_pending_notifications"
        `);
  }
}
