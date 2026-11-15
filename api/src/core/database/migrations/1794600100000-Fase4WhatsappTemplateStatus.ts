import { MigrationInterface, QueryRunner } from "typeorm";

export class Fase4WhatsappTemplateStatus1794600100000 implements MigrationInterface {
    name = 'Fase4WhatsappTemplateStatus1794600100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "whatsapp_template_statuses" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "account_id" bigint NOT NULL, "catalog_key" character varying(100) NOT NULL, "meta_template_id" character varying(50), "status" character varying(20) NOT NULL DEFAULT 'PENDING', "fecha_ultima_sincronizacion" TIMESTAMP, "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP DEFAULT now(), CONSTRAINT "UQ_wa_template_statuses_public_id" UNIQUE ("public_id"), CONSTRAINT "UQ_wa_template_statuses_tenant_catalog" UNIQUE ("tenant_id", "catalog_key"), CONSTRAINT "PK_wa_template_statuses_id" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "whatsapp_template_statuses"`);
    }

}
