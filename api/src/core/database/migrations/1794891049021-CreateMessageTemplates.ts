import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMessageTemplates1794891049021 implements MigrationInterface {
  name = "CreateMessageTemplates1794891049021";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "message_templates" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "clave" character varying(100) NOT NULL,
            "texto" text NOT NULL,
            "descripcion" character varying(255),
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            "fecha_actualizacion" TIMESTAMP DEFAULT now(),
            CONSTRAINT "UQ_003a639f97a5a7066cae2b94ac8" UNIQUE ("public_id"),
            CONSTRAINT "UQ_eb2081a8418cd416c1020b4310e" UNIQUE ("tenant_id", "clave"),
            CONSTRAINT "PK_9ac2bd9635be662d183f314947d" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          ALTER TABLE "message_templates"
          ADD CONSTRAINT "FK_message_templates_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "message_templates"
          DROP CONSTRAINT "FK_message_templates_tenant"
        `);
    await queryRunner.query(`
          DROP TABLE "message_templates"
        `);
  }
}
