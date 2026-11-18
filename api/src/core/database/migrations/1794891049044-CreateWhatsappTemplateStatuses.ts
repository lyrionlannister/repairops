import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWhatsappTemplateStatuses1794891049044 implements MigrationInterface {
  name = "CreateWhatsappTemplateStatuses1794891049044";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "whatsapp_template_statuses" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "account_id" bigint NOT NULL,
            "catalog_entry_id" bigint NOT NULL,
            "meta_template_id" character varying(50),
            "status" character varying(20) NOT NULL DEFAULT 'PENDING',
            "fecha_ultima_sincronizacion" TIMESTAMP,
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            "fecha_actualizacion" TIMESTAMP DEFAULT now(),
            CONSTRAINT "UQ_de1ee96d954152f5fcbe13a3c0c" UNIQUE ("public_id"),
            CONSTRAINT "UQ_af3dbea3113bd76853e44730535" UNIQUE ("tenant_id", "catalog_entry_id"),
            CONSTRAINT "PK_a3327469a1a7e37c67e39239544" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_whatsapp_template_statuses_account_id" ON "whatsapp_template_statuses" ("account_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "whatsapp_template_statuses"
          ADD CONSTRAINT "FK_whatsapp_template_statuses_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "whatsapp_template_statuses"
          ADD CONSTRAINT "FK_whatsapp_template_statuses_account_id" FOREIGN KEY ("account_id") REFERENCES "whatsapp_accounts" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "whatsapp_template_statuses"
          ADD CONSTRAINT "FK_ce4eea887d526765fb9f02567b5" FOREIGN KEY ("catalog_entry_id") REFERENCES "whatsapp_template_catalog_entries" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "whatsapp_template_statuses"
          DROP CONSTRAINT "FK_ce4eea887d526765fb9f02567b5"
        `);
    await queryRunner.query(`
          ALTER TABLE "whatsapp_template_statuses"
          DROP CONSTRAINT "FK_whatsapp_template_statuses_account_id"
        `);
    await queryRunner.query(`
          ALTER TABLE "whatsapp_template_statuses"
          DROP CONSTRAINT "FK_whatsapp_template_statuses_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_whatsapp_template_statuses_account_id"
        `);
    await queryRunner.query(`
          DROP TABLE "whatsapp_template_statuses"
        `);
  }
}
