import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRepairNoteItems1794891049025 implements MigrationInterface {
  name = "CreateRepairNoteItems1794891049025";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "repair_note_items" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "id_nota_reparacion" bigint NOT NULL,
            "id_item_inventario" bigint NOT NULL,
            "cantidad" integer NOT NULL,
            "precio_unitario" numeric(10, 2) NOT NULL,
            CONSTRAINT "UQ_adffd9afba0e5d28105d74bfdec" UNIQUE ("public_id"),
            CONSTRAINT "PK_d90a3737648d0fdd0d7b3a81cf6" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_repair_note_items_id_nota_reparacion" ON "repair_note_items" ("id_nota_reparacion")
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_repair_note_items_tenant" ON "repair_note_items" ("tenant_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "repair_note_items"
          ADD CONSTRAINT "FK_repair_note_items_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "repair_note_items"
          ADD CONSTRAINT "FK_repair_note_items_id_nota_reparacion" FOREIGN KEY ("id_nota_reparacion") REFERENCES "repair_notes" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "repair_note_items"
          DROP CONSTRAINT "FK_repair_note_items_id_nota_reparacion"
        `);
    await queryRunner.query(`
          ALTER TABLE "repair_note_items"
          DROP CONSTRAINT "FK_repair_note_items_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_repair_note_items_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_repair_note_items_id_nota_reparacion"
        `);
    await queryRunner.query(`
          DROP TABLE "repair_note_items"
        `);
  }
}
