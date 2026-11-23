import { MigrationInterface, QueryRunner } from "typeorm";

// Cada nota existente pasa a tener un equipo (posicion 0) con los datos que traia en
// sus columnas; despues las columnas salen de repair_notes. down() hace el camino
// inverso tomando el primer equipo de cada nota (los demas equipos se pierden).
export class MoveRepairNoteDevices1795600000003 implements MigrationInterface {
  name = "MoveRepairNoteDevices1795600000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "repair_note_devices" ("tenant_id", "id_nota_reparacion", "posicion", "marca", "modelo", "falla_reportada", "dispositivo_apagado")
      SELECT "tenant_id", "id", 0, "marca", "modelo", "falla_reportada", "dispositivo_apagado"
      FROM "repair_notes"
    `);
    await queryRunner.query(`ALTER TABLE "repair_notes" DROP COLUMN "dispositivo_apagado"`);
    await queryRunner.query(`ALTER TABLE "repair_notes" DROP COLUMN "marca"`);
    await queryRunner.query(`ALTER TABLE "repair_notes" DROP COLUMN "modelo"`);
    await queryRunner.query(`ALTER TABLE "repair_notes" DROP COLUMN "falla_reportada"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "repair_notes" ADD "falla_reportada" text`);
    await queryRunner.query(`ALTER TABLE "repair_notes" ADD "modelo" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "repair_notes" ADD "marca" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "repair_notes" ADD "dispositivo_apagado" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`
      UPDATE "repair_notes" n
      SET "marca" = d."marca", "modelo" = d."modelo", "falla_reportada" = d."falla_reportada", "dispositivo_apagado" = d."dispositivo_apagado"
      FROM (
        SELECT DISTINCT ON ("id_nota_reparacion") *
        FROM "repair_note_devices"
        ORDER BY "id_nota_reparacion", "posicion"
      ) d
      WHERE d."id_nota_reparacion" = n."id"
    `);
    await queryRunner.query(`UPDATE "repair_notes" SET "marca" = '', "modelo" = '', "falla_reportada" = '' WHERE "marca" IS NULL`);
    await queryRunner.query(`ALTER TABLE "repair_notes" ALTER COLUMN "marca" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "repair_notes" ALTER COLUMN "modelo" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "repair_notes" ALTER COLUMN "falla_reportada" SET NOT NULL`);
  }
}
