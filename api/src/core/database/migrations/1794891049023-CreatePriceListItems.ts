import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePriceListItems1794891049023 implements MigrationInterface {
  name = "CreatePriceListItems1794891049023";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "price_list_items" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "marca" character varying(100) NOT NULL,
            "modelo" character varying(255) NOT NULL,
            "precio" numeric(10, 2) NOT NULL,
            "id_proveedor" bigint NOT NULL,
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            "fecha_actualizacion" TIMESTAMP DEFAULT now(),
            CONSTRAINT "UQ_ffadc131ab88900bc77930ee291" UNIQUE ("public_id"),
            CONSTRAINT "PK_cdb44449658589feac39de86695" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_price_list_items_tenant" ON "price_list_items" ("tenant_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "price_list_items"
          ADD CONSTRAINT "FK_price_list_items_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "price_list_items"
          ADD CONSTRAINT "FK_535b641441af99a80cb2e69d916" FOREIGN KEY ("id_proveedor") REFERENCES "proveedores" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "price_list_items"
          DROP CONSTRAINT "FK_535b641441af99a80cb2e69d916"
        `);
    await queryRunner.query(`
          ALTER TABLE "price_list_items"
          DROP CONSTRAINT "FK_price_list_items_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_price_list_items_tenant"
        `);
    await queryRunner.query(`
          DROP TABLE "price_list_items"
        `);
  }
}
