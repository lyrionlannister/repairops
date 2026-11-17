import { MigrationInterface, QueryRunner } from "typeorm";

export class ChatMedia1794886644752 implements MigrationInterface {
    name = 'ChatMedia1794886644752'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD "message_type" character varying(12) NOT NULL DEFAULT 'text'`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD "media_key" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD "media_mime" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD "media_size" integer`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD "location_lat" numeric(9,6)`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD "location_lng" numeric(9,6)`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "CHK_chat_messages_media_complete" CHECK ("media_key" IS NULL OR ("media_mime" IS NOT NULL AND "media_size" IS NOT NULL))`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "CHK_chat_messages_location" CHECK ("message_type" <> 'location' OR ("location_lat" IS NOT NULL AND "location_lng" IS NOT NULL))`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "CHK_chat_messages_text_plain" CHECK ("message_type" <> 'text' OR ("media_key" IS NULL AND "media_mime" IS NULL AND "media_size" IS NULL AND "location_lat" IS NULL AND "location_lng" IS NULL))`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "CHK_chat_messages_type" CHECK ("message_type" IN ('text', 'image', 'audio', 'video', 'document', 'sticker', 'location'))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "CHK_chat_messages_type"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "CHK_chat_messages_text_plain"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "CHK_chat_messages_location"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "CHK_chat_messages_media_complete"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP COLUMN "location_lng"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP COLUMN "location_lat"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP COLUMN "media_size"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP COLUMN "media_mime"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP COLUMN "media_key"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP COLUMN "message_type"`);
    }

}
