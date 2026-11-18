import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateQuoteItems1794891049034 implements MigrationInterface {
  name = "CreateQuoteItems1794891049034";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "quote_items" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "id_cotizacion" bigint NOT NULL,
            "id_item_inventario" bigint,
            "descripcion" character varying(255) NOT NULL,
            "cantidad" integer NOT NULL,
            "precio_unitario" numeric(10, 2) NOT NULL,
            CONSTRAINT "UQ_5cb0fa39190f2d665942b9726e6" UNIQUE ("public_id"),
            CONSTRAINT "PK_135ad3f02b5abcf65fb5cb20ad2" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_quote_items_id_cotizacion" ON "quote_items" ("id_cotizacion")
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_quote_items_tenant" ON "quote_items" ("tenant_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "quote_items"
          ADD CONSTRAINT "FK_quote_items_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "quote_items"
          ADD CONSTRAINT "FK_quote_items_id_cotizacion" FOREIGN KEY ("id_cotizacion") REFERENCES "quotes" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "quote_items"
          DROP CONSTRAINT "FK_quote_items_id_cotizacion"
        `);
    await queryRunner.query(`
          ALTER TABLE "quote_items"
          DROP CONSTRAINT "FK_quote_items_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_quote_items_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_quote_items_id_cotizacion"
        `);
    await queryRunner.query(`
          DROP TABLE "quote_items"
        `);
  }
}
