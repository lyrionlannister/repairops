import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWhatsappAccounts1794891049042 implements MigrationInterface {
    name = 'CreateWhatsappAccounts1794891049042'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "whatsapp_accounts" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "waba_id" character varying(50) NOT NULL, "phone_number_id" character varying(50) NOT NULL, "access_token" text NOT NULL, "owned_by_platform" boolean NOT NULL DEFAULT true, "display_phone_number" character varying(32), "status" character varying(20) NOT NULL DEFAULT 'connected', "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP DEFAULT now(), CONSTRAINT "UQ_eccde599c314ad3a23891c96a41" UNIQUE ("public_id"), CONSTRAINT "UQ_02f21802c06f6139e91f5408074" UNIQUE ("tenant_id"), CONSTRAINT "PK_7b68a09f30ca28e87f73c9e844b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "whatsapp_accounts" ADD CONSTRAINT "FK_whatsapp_accounts_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "whatsapp_accounts" DROP CONSTRAINT "FK_whatsapp_accounts_tenant"`);
        await queryRunner.query(`DROP TABLE "whatsapp_accounts"`);
    }

}
