import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateQuoteServiceTypes1794891049035 implements MigrationInterface {
  name = "CreateQuoteServiceTypes1794891049035";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "quote_service_types" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "id_cotizacion" bigint NOT NULL,
            "id_tipo_servicio" bigint NOT NULL,
            CONSTRAINT "UQ_quote_service_types_public_id" UNIQUE ("public_id"),
            CONSTRAINT "PK_quote_service_types" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_quote_service_types_id_tipo_servicio" ON "quote_service_types" ("id_tipo_servicio")
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_quote_service_types_id_cotizacion" ON "quote_service_types" ("id_cotizacion")
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_quote_service_types_tenant" ON "quote_service_types" ("tenant_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "quote_service_types"
          ADD CONSTRAINT "FK_quote_service_types_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "quote_service_types"
          ADD CONSTRAINT "FK_quote_service_types_id_cotizacion" FOREIGN KEY ("id_cotizacion") REFERENCES "quotes" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "quote_service_types"
          ADD CONSTRAINT "FK_quote_service_types_id_tipo_servicio" FOREIGN KEY ("id_tipo_servicio") REFERENCES "service_types" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "quote_service_types"
          DROP CONSTRAINT "FK_quote_service_types_id_tipo_servicio"
        `);
    await queryRunner.query(`
          ALTER TABLE "quote_service_types"
          DROP CONSTRAINT "FK_quote_service_types_id_cotizacion"
        `);
    await queryRunner.query(`
          ALTER TABLE "quote_service_types"
          DROP CONSTRAINT "FK_quote_service_types_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_quote_service_types_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_quote_service_types_id_cotizacion"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_quote_service_types_id_tipo_servicio"
        `);
    await queryRunner.query(`
          DROP TABLE "quote_service_types"
        `);
  }
}
