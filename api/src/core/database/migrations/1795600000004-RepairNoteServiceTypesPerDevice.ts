import { MigrationInterface, QueryRunner } from "typeorm";

// Los tipos de servicio pasan de la nota a cada equipo. Los enlaces existentes se
// asignan al primer equipo de su nota (hasta ahora toda nota tenia uno solo con sus
// tipos). Un enlace repetido nota+tipo se colapsa en uno antes del UNIQUE.
export class RepairNoteServiceTypesPerDevice1795600000004 implements MigrationInterface {
  name = "RepairNoteServiceTypesPerDevice1795600000004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "repair_note_service_types"
      ADD "id_equipo_nota" bigint
    `);
    await queryRunner.query(`
      UPDATE "repair_note_service_types" l
      SET "id_equipo_nota" = d."id"
      FROM (
        SELECT DISTINCT ON ("id_nota_reparacion") "id", "id_nota_reparacion"
        FROM "repair_note_devices"
        ORDER BY "id_nota_reparacion", "posicion"
      ) d
      WHERE d."id_nota_reparacion" = l."id_nota_reparacion"
    `);
    await queryRunner.query(`
      DELETE FROM "repair_note_service_types" l
      USING "repair_note_service_types" k
      WHERE l."id_equipo_nota" = k."id_equipo_nota"
        AND l."id_tipo_servicio" = k."id_tipo_servicio"
        AND l."id" > k."id"
    `);
    await queryRunner.query(`
      ALTER TABLE "repair_note_service_types"
      ALTER COLUMN "id_equipo_nota"
      SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "repair_note_service_types"
      ADD CONSTRAINT "UQ_repair_note_service_types_equipo_tipo" UNIQUE ("id_equipo_nota", "id_tipo_servicio")
    `);
    await queryRunner.query(`
      ALTER TABLE "repair_note_service_types"
      ADD CONSTRAINT "FK_repair_note_service_types_id_equipo_nota" FOREIGN KEY ("id_equipo_nota") REFERENCES "repair_note_devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "repair_note_service_types"
      DROP CONSTRAINT "FK_repair_note_service_types_id_equipo_nota"
    `);
    await queryRunner.query(`
      ALTER TABLE "repair_note_service_types"
      DROP CONSTRAINT "UQ_repair_note_service_types_equipo_tipo"
    `);
    await queryRunner.query(`
      DELETE FROM "repair_note_service_types" l
      USING "repair_note_service_types" k
      WHERE l."id_nota_reparacion" = k."id_nota_reparacion"
        AND l."id_tipo_servicio" = k."id_tipo_servicio"
        AND l."id" > k."id"
    `);
    await queryRunner.query(`
      ALTER TABLE "repair_note_service_types"
      DROP COLUMN "id_equipo_nota"
    `);
  }
}
