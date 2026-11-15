import { MigrationInterface, QueryRunner } from "typeorm";

export class Fase4WhatsappAccount1794600000000 implements MigrationInterface {
    name = 'Fase4WhatsappAccount1794600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "whatsapp_accounts" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "waba_id" character varying(50) NOT NULL, "phone_number_id" character varying(50) NOT NULL, "access_token" text NOT NULL, "owned_by_platform" boolean NOT NULL DEFAULT true, "status" character varying(20) NOT NULL DEFAULT 'connected', "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP DEFAULT now(), CONSTRAINT "UQ_wa_accounts_public_id" UNIQUE ("public_id"), CONSTRAINT "UQ_wa_accounts_tenant_id" UNIQUE ("tenant_id"), CONSTRAINT "PK_wa_accounts_id" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "whatsapp_accounts"`);
    }

}
