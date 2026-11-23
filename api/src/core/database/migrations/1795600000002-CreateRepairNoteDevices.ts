import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRepairNoteDevices1795600000002 implements MigrationInterface {
  name = "CreateRepairNoteDevices1795600000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "repair_note_devices" (
        "id" BIGSERIAL NOT NULL,
        "public_id" uuid NOT NULL DEFAULT uuidv7(),
        "tenant_id" bigint NOT NULL,
        "id_nota_reparacion" bigint NOT NULL,
        "posicion" integer NOT NULL,
        "marca" character varying(255) NOT NULL,
        "modelo" character varying(255) NOT NULL,
        "falla_reportada" text NOT NULL,
        "dispositivo_apagado" boolean NOT NULL DEFAULT false,
        CONSTRAINT "UQ_0ccbf3e1abf7ee58deb0baa1579" UNIQUE ("public_id"),
        CONSTRAINT "UQ_repair_note_devices_nota_posicion" UNIQUE ("id_nota_reparacion", "posicion"),
        CONSTRAINT "CHK_repair_note_devices_posicion" CHECK ("posicion" >= 0),
        CONSTRAINT "PK_9d3ec017f303a7989b9cac32306" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_repair_note_devices_tenant" ON "repair_note_devices" ("tenant_id")`);
    await queryRunner.query(`
      ALTER TABLE "repair_note_devices"
      ADD CONSTRAINT "FK_repair_note_devices_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "repair_note_devices"
      ADD CONSTRAINT "FK_repair_note_devices_id_nota_reparacion" FOREIGN KEY ("id_nota_reparacion") REFERENCES "repair_notes" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "repair_note_devices" DROP CONSTRAINT "FK_repair_note_devices_id_nota_reparacion"`);
    await queryRunner.query(`ALTER TABLE "repair_note_devices" DROP CONSTRAINT "FK_repair_note_devices_tenant"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_repair_note_devices_tenant"`);
    await queryRunner.query(`DROP TABLE "repair_note_devices"`);
  }
}
