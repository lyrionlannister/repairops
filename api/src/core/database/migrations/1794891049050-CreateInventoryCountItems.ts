import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInventoryCountItems1794891049050 implements MigrationInterface {
  name = "CreateInventoryCountItems1794891049050";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "inventory_count_items" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "id_conteo" bigint NOT NULL,
            "id_item_inventario" bigint NOT NULL,
            "cantidad_contada" integer,
            "motivo" text,
            "id_movimiento_aplicado" bigint,
            CONSTRAINT "UQ_81c311e893b58e38e679bfa6f78" UNIQUE ("public_id"),
            CONSTRAINT "PK_e1e695e1a140cdc8b94542d4956" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_inventory_count_items_tenant" ON "inventory_count_items" ("tenant_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "inventory_count_items"
          ADD CONSTRAINT "FK_inventory_count_items_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "inventory_count_items"
          ADD CONSTRAINT "FK_284b26120966dcef49cd67e63d9" FOREIGN KEY ("id_conteo") REFERENCES "inventory_counts" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "inventory_count_items"
          ADD CONSTRAINT "FK_18e160af8ebd147131ac02ca3fe" FOREIGN KEY ("id_item_inventario") REFERENCES "inventory_items" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "inventory_count_items"
          ADD CONSTRAINT "FK_938dacb4f9cd256c90b4f09c3f5" FOREIGN KEY ("id_movimiento_aplicado") REFERENCES "inventory_movements" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "inventory_count_items"
          DROP CONSTRAINT "FK_938dacb4f9cd256c90b4f09c3f5"
        `);
    await queryRunner.query(`
          ALTER TABLE "inventory_count_items"
          DROP CONSTRAINT "FK_18e160af8ebd147131ac02ca3fe"
        `);
    await queryRunner.query(`
          ALTER TABLE "inventory_count_items"
          DROP CONSTRAINT "FK_284b26120966dcef49cd67e63d9"
        `);
    await queryRunner.query(`
          ALTER TABLE "inventory_count_items"
          DROP CONSTRAINT "FK_inventory_count_items_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_inventory_count_items_tenant"
        `);
    await queryRunner.query(`
          DROP TABLE "inventory_count_items"
        `);
  }
}
