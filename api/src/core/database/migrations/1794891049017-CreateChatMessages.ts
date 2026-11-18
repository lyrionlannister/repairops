import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChatMessages1794891049017 implements MigrationInterface {
    name = 'CreateChatMessages1794891049017'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chat_messages" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "contact_phone" character varying(32) NOT NULL, "direction" character varying(10) NOT NULL, "sender" character varying(10) NOT NULL, "body" text NOT NULL, "wa_message_id" character varying(128), "message_type" character varying(12) NOT NULL DEFAULT 'text', "media_key" character varying(255), "media_mime" character varying(100), "media_size" integer, "location_lat" numeric(9,6), "location_lng" numeric(9,6), "repair_note_id" bigint, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_2a4e3695187aba71e6237d492a8" UNIQUE ("public_id"), CONSTRAINT "CHK_chat_messages_media_complete" CHECK ("media_key" IS NULL OR ("media_mime" IS NOT NULL AND "media_size" IS NOT NULL)), CONSTRAINT "CHK_chat_messages_location" CHECK ("message_type" <> 'location' OR ("location_lat" IS NOT NULL AND "location_lng" IS NOT NULL)), CONSTRAINT "CHK_chat_messages_text_plain" CHECK ("message_type" <> 'text' OR ("media_key" IS NULL AND "media_mime" IS NULL AND "media_size" IS NULL AND "location_lat" IS NULL AND "location_lng" IS NULL)), CONSTRAINT "CHK_chat_messages_type" CHECK ("message_type" IN ('text', 'image', 'audio', 'video', 'document', 'sticker', 'location')), CONSTRAINT "CHK_chat_messages_direction_sender" CHECK (("direction" = 'inbound' AND "sender" = 'customer') OR ("direction" = 'outbound' AND "sender" IN ('ai', 'agent'))), CONSTRAINT "CHK_chat_messages_sender" CHECK ("sender" IN ('customer', 'ai', 'agent')), CONSTRAINT "CHK_chat_messages_direction" CHECK ("direction" IN ('inbound', 'outbound')), CONSTRAINT "PK_40c55ee0e571e268b0d3cd37d10" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_chat_messages_tenant_wa_message" ON "chat_messages" ("tenant_id", "wa_message_id") WHERE "wa_message_id" IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_chat_messages_repair_note" ON "chat_messages" ("repair_note_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_chat_messages_tenant_created" ON "chat_messages" ("tenant_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_chat_messages_tenant_contact" ON "chat_messages" ("tenant_id", "contact_phone", "id") `);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_chat_messages_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_chat_messages_repair_note" FOREIGN KEY ("repair_note_id") REFERENCES "repair_notes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_chat_messages_repair_note"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_chat_messages_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_chat_messages_tenant_contact"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_chat_messages_tenant_created"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_chat_messages_repair_note"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_chat_messages_tenant_wa_message"`);
        await queryRunner.query(`DROP TABLE "chat_messages"`);
    }

}
