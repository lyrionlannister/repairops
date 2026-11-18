import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInventoryItems1794891049028 implements MigrationInterface {
  name = "CreateInventoryItems1794891049028";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "inventory_items" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "local_id" bigint NOT NULL,
            "nombre" character varying(255) NOT NULL,
            "sku" character varying(100),
            "id_proveedor" bigint,
            "tipo" character varying(20) NOT NULL DEFAULT 'accessory',
            "precio_costo" numeric(10, 2) NOT NULL,
            "precio_venta" numeric(10, 2) NOT NULL,
            "cantidad_disponible" integer NOT NULL DEFAULT '0',
            "stock_minimo" integer NOT NULL DEFAULT '0',
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            "fecha_actualizacion" TIMESTAMP DEFAULT now(),
            CONSTRAINT "UQ_6ba7465fb298a1fa754f9cae883" UNIQUE ("public_id"),
            CONSTRAINT "PK_cf2f451407242e132547ac19169" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_inventory_items_local" ON "inventory_items" ("local_id")
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_inventory_items_tenant" ON "inventory_items" ("tenant_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "inventory_items"
          ADD CONSTRAINT "FK_inventory_items_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "inventory_items"
          ADD CONSTRAINT "FK_inventory_items_local" FOREIGN KEY ("local_id") REFERENCES "branches" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "inventory_items"
          ADD CONSTRAINT "FK_03a8eb63a3da0a283b845cf75a0" FOREIGN KEY ("id_proveedor") REFERENCES "proveedores" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "inventory_items"
          DROP CONSTRAINT "FK_03a8eb63a3da0a283b845cf75a0"
        `);
    await queryRunner.query(`
          ALTER TABLE "inventory_items"
          DROP CONSTRAINT "FK_inventory_items_local"
        `);
    await queryRunner.query(`
          ALTER TABLE "inventory_items"
          DROP CONSTRAINT "FK_inventory_items_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_inventory_items_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_inventory_items_local"
        `);
    await queryRunner.query(`
          DROP TABLE "inventory_items"
        `);
  }
}
