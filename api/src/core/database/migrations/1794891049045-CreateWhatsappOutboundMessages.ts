import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWhatsappOutboundMessages1794891049045 implements MigrationInterface {
  name = "CreateWhatsappOutboundMessages1794891049045";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "whatsapp_outbound_messages" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "account_id" bigint NOT NULL,
            "catalog_key" character varying(100) NOT NULL,
            "destinatario" character varying(50) NOT NULL,
            "variables" jsonb NOT NULL DEFAULT '{}',
            "idempotency_key" character varying(100) NOT NULL,
            "status" character varying(30) NOT NULL,
            "meta_message_id" character varying(50),
            "error_message" text,
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            "fecha_actualizacion" TIMESTAMP DEFAULT now(),
            CONSTRAINT "UQ_87aa9db556c9717675c99d76f59" UNIQUE ("public_id"),
            CONSTRAINT "UQ_54a92479d302209b9654672611d" UNIQUE ("tenant_id", "idempotency_key"),
            CONSTRAINT "PK_47b295a6e09fcdf4aa45507d7b6" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_whatsapp_outbound_messages_account_id" ON "whatsapp_outbound_messages" ("account_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "whatsapp_outbound_messages"
          ADD CONSTRAINT "FK_whatsapp_outbound_messages_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "whatsapp_outbound_messages"
          ADD CONSTRAINT "FK_whatsapp_outbound_messages_account_id" FOREIGN KEY ("account_id") REFERENCES "whatsapp_accounts" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "whatsapp_outbound_messages"
          DROP CONSTRAINT "FK_whatsapp_outbound_messages_account_id"
        `);
    await queryRunner.query(`
          ALTER TABLE "whatsapp_outbound_messages"
          DROP CONSTRAINT "FK_whatsapp_outbound_messages_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_whatsapp_outbound_messages_account_id"
        `);
    await queryRunner.query(`
          DROP TABLE "whatsapp_outbound_messages"
        `);
  }
}
