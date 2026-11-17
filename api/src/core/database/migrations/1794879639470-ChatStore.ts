import { MigrationInterface, QueryRunner } from "typeorm";

export class ChatStore1794879639470 implements MigrationInterface {
    name = 'ChatStore1794879639470'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chat_messages" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "contact_phone" character varying(32) NOT NULL, "direction" character varying(10) NOT NULL, "sender" character varying(10) NOT NULL, "body" text NOT NULL, "wa_message_id" character varying(128), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_2a4e3695187aba71e6237d492a8" UNIQUE ("public_id"), CONSTRAINT "CHK_chat_messages_direction_sender" CHECK (("direction" = 'inbound' AND "sender" = 'customer') OR ("direction" = 'outbound' AND "sender" IN ('ai', 'agent'))), CONSTRAINT "CHK_chat_messages_sender" CHECK ("sender" IN ('customer', 'ai', 'agent')), CONSTRAINT "CHK_chat_messages_direction" CHECK ("direction" IN ('inbound', 'outbound')), CONSTRAINT "PK_40c55ee0e571e268b0d3cd37d10" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_chat_messages_tenant_wa_message" ON "chat_messages" ("tenant_id", "wa_message_id") WHERE "wa_message_id" IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_chat_messages_tenant_created" ON "chat_messages" ("tenant_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_chat_messages_tenant_contact" ON "chat_messages" ("tenant_id", "contact_phone", "id") `);
        await queryRunner.query(`CREATE TABLE "chat_daily_stats" ("tenant_id" bigint NOT NULL, "day" date NOT NULL, "messages" integer NOT NULL DEFAULT '0', "last_message_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_9677eaa85870885adc16a92bd18" PRIMARY KEY ("tenant_id", "day"))`);
        await queryRunner.query(`CREATE TABLE "chat_daily_contacts" ("tenant_id" bigint NOT NULL, "day" date NOT NULL, "contact_phone" character varying(32) NOT NULL, CONSTRAINT "PK_b544cde51d3766ee40dadf70c12" PRIMARY KEY ("tenant_id", "day", "contact_phone"))`);
        // Sin tenant no se puede asignar un nombre de contacto a un taller: las filas viejas se descartan.
        await queryRunner.query(`DELETE FROM "contact_names"`);
        await queryRunner.query(`ALTER TABLE "contact_names" ADD "tenant_id" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "contact_names" DROP CONSTRAINT "PK_986bd510e9387ec398b4ecfbb3b"`);
        await queryRunner.query(`ALTER TABLE "contact_names" ADD CONSTRAINT "PK_b6051a3d6864eefc0406e9a353f" PRIMARY KEY ("tenant_id", "telefono")`);
        await queryRunner.query(`ALTER TABLE "contact_names" ADD CONSTRAINT "FK_contact_names_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_chat_messages_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_daily_stats" ADD CONSTRAINT "FK_chat_daily_stats_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_daily_contacts" ADD CONSTRAINT "FK_chat_daily_contacts_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_daily_contacts" DROP CONSTRAINT "FK_chat_daily_contacts_tenant"`);
        await queryRunner.query(`ALTER TABLE "chat_daily_stats" DROP CONSTRAINT "FK_chat_daily_stats_tenant"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_chat_messages_tenant"`);
        await queryRunner.query(`ALTER TABLE "contact_names" DROP CONSTRAINT "FK_contact_names_tenant"`);
        await queryRunner.query(`ALTER TABLE "contact_names" DROP CONSTRAINT "PK_b6051a3d6864eefc0406e9a353f"`);
        await queryRunner.query(`DELETE FROM "contact_names"`);
        await queryRunner.query(`ALTER TABLE "contact_names" ADD CONSTRAINT "PK_986bd510e9387ec398b4ecfbb3b" PRIMARY KEY ("telefono")`);
        await queryRunner.query(`ALTER TABLE "contact_names" DROP COLUMN "tenant_id"`);
        await queryRunner.query(`DROP TABLE "chat_daily_contacts"`);
        await queryRunner.query(`DROP TABLE "chat_daily_stats"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_chat_messages_tenant_contact"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_chat_messages_tenant_created"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_chat_messages_tenant_wa_message"`);
        await queryRunner.query(`DROP TABLE "chat_messages"`);
    }

}
