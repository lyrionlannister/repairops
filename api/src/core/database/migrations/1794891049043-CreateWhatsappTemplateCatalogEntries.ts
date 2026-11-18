import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWhatsappTemplateCatalogEntries1794891049043 implements MigrationInterface {
  name = "CreateWhatsappTemplateCatalogEntries1794891049043";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TYPE "public"."whatsapp_template_category" AS ENUM('UTILITY', 'MARKETING', 'AUTHENTICATION')
        `);
    await queryRunner.query(`
          CREATE TABLE "whatsapp_template_catalog_entries" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint,
            "key" character varying(100) NOT NULL,
            "meta_name" character varying(100) NOT NULL,
            "category" "public"."whatsapp_template_category" NOT NULL,
            "language" character varying(20) NOT NULL,
            "text" text NOT NULL,
            "variables" jsonb NOT NULL DEFAULT '[]',
            "trigger_event" character varying(100),
            "enabled" boolean NOT NULL DEFAULT true,
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            "fecha_actualizacion" TIMESTAMP DEFAULT now(),
            CONSTRAINT "UQ_1d997ff0ab7deaddeaa62c220ab" UNIQUE ("public_id"),
            CONSTRAINT "UQ_6276c258ac43948dfcc1f332d26" UNIQUE ("tenant_id", "meta_name"),
            CONSTRAINT "UQ_62b2c24361eb5dd038a4afadd61" UNIQUE ("tenant_id", "key"),
            CONSTRAINT "PK_b72e6c6e3cfdb01854c1864c94d" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          CREATE UNIQUE INDEX "UQ_wa_template_catalog_system_meta_name" ON "whatsapp_template_catalog_entries" ("meta_name")
          WHERE
            "tenant_id" IS NULL
        `);
    await queryRunner.query(`
          CREATE UNIQUE INDEX "UQ_wa_template_catalog_system_key" ON "whatsapp_template_catalog_entries" ("key")
          WHERE
            "tenant_id" IS NULL
        `);
    await queryRunner.query(`
          ALTER TABLE "whatsapp_template_catalog_entries"
          ADD CONSTRAINT "FK_whatsapp_template_catalog_entries_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "whatsapp_template_catalog_entries"
          DROP CONSTRAINT "FK_whatsapp_template_catalog_entries_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."UQ_wa_template_catalog_system_key"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."UQ_wa_template_catalog_system_meta_name"
        `);
    await queryRunner.query(`
          DROP TABLE "whatsapp_template_catalog_entries"
        `);
    await queryRunner.query(`
          DROP TYPE "public"."whatsapp_template_category"
        `);
  }
}
