import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWhatsappMessagePackages1795600000009 implements MigrationInterface {
  name = "CreateWhatsappMessagePackages1795600000009";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "whatsapp_message_packages" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuidv7(),
            "tenant_id" bigint NOT NULL,
            "stripe_checkout_session_id" character varying(255) NOT NULL,
            "stripe_price_key" character varying(60) NOT NULL,
            "messages_granted" integer NOT NULL,
            "amount_paid" numeric(10,2) NOT NULL,
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_whatsapp_message_packages_public_id" UNIQUE ("public_id"),
            CONSTRAINT "UQ_whatsapp_message_packages_checkout_session" UNIQUE ("stripe_checkout_session_id"),
            CONSTRAINT "CHK_whatsapp_message_packages_messages" CHECK ("messages_granted" > 0),
            CONSTRAINT "PK_whatsapp_message_packages" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          ALTER TABLE "whatsapp_message_packages"
          ADD CONSTRAINT "FK_whatsapp_message_packages_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_whatsapp_message_packages_tenant" ON "whatsapp_message_packages" ("tenant_id")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          DROP INDEX IF EXISTS "IDX_whatsapp_message_packages_tenant"
        `);
    await queryRunner.query(`
          ALTER TABLE "whatsapp_message_packages" DROP CONSTRAINT "FK_whatsapp_message_packages_tenant"
        `);
    await queryRunner.query(`
          DROP TABLE "whatsapp_message_packages"
        `);
  }
}
