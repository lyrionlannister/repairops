import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSaleItems1794891049031 implements MigrationInterface {
  name = "CreateSaleItems1794891049031";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "sale_items" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "id_venta" bigint NOT NULL,
            "tipo_linea" character varying(20) NOT NULL,
            "id_referencia" bigint NOT NULL,
            "cantidad" integer NOT NULL,
            "precio_unitario" numeric(10, 2) NOT NULL,
            "monto_descuento" numeric(10, 2) NOT NULL DEFAULT '0',
            CONSTRAINT "UQ_b24e16ad5dfc4c4ae818ec5fb24" UNIQUE ("public_id"),
            CONSTRAINT "PK_5a7dc5b4562a9e590528b3e08ab" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_sale_items_id_venta" ON "sale_items" ("id_venta")
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_sale_items_tenant" ON "sale_items" ("tenant_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "sale_items"
          ADD CONSTRAINT "FK_sale_items_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "sale_items"
          ADD CONSTRAINT "FK_sale_items_id_venta" FOREIGN KEY ("id_venta") REFERENCES "sales" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "sale_items"
          DROP CONSTRAINT "FK_sale_items_id_venta"
        `);
    await queryRunner.query(`
          ALTER TABLE "sale_items"
          DROP CONSTRAINT "FK_sale_items_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_sale_items_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_sale_items_id_venta"
        `);
    await queryRunner.query(`
          DROP TABLE "sale_items"
        `);
  }
}
