import { MigrationInterface, QueryRunner } from "typeorm";

export class Fase4WhatsappOutboundMessage1794600200000 implements MigrationInterface {
    name = 'Fase4WhatsappOutboundMessage1794600200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "whatsapp_outbound_messages" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "account_id" bigint NOT NULL, "catalog_key" character varying(100) NOT NULL, "destinatario" character varying(50) NOT NULL, "variables" jsonb NOT NULL DEFAULT '{}', "idempotency_key" character varying(100) NOT NULL, "status" character varying(30) NOT NULL, "meta_message_id" character varying(50), "error_message" text, "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP DEFAULT now(), CONSTRAINT "UQ_wa_outbound_messages_public_id" UNIQUE ("public_id"), CONSTRAINT "UQ_wa_outbound_messages_tenant_idempotency" UNIQUE ("tenant_id", "idempotency_key"), CONSTRAINT "PK_wa_outbound_messages_id" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "whatsapp_outbound_messages"`);
    }

}
