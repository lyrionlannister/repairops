import { MigrationInterface, QueryRunner } from "typeorm";

export class Fase5GeneralizeInventoryReservation1794716894430 implements MigrationInterface {
    name = 'Fase5GeneralizeInventoryReservation1794716894430'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Backfill antes de soltar la columna vieja: toda reserva existente
        // hoy vino de una nota de reparacion (unico origen hasta esta fase).
        await queryRunner.query(`ALTER TABLE "inventory_reservations" ADD "tipo_entidad_relacionada" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" ADD "id_entidad_relacionada" bigint`);
        await queryRunner.query(`UPDATE "inventory_reservations" SET "tipo_entidad_relacionada" = 'repair_note_item', "id_entidad_relacionada" = "id_item_nota_reparacion"`);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" ALTER COLUMN "tipo_entidad_relacionada" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" ALTER COLUMN "id_entidad_relacionada" SET NOT NULL`);

        await queryRunner.query(`ALTER TABLE "inventory_reservations" DROP CONSTRAINT "FK_104ce622191cb4fe99c37425654"`);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" DROP CONSTRAINT "UQ_104ce622191cb4fe99c37425654"`);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" DROP COLUMN "id_item_nota_reparacion"`);
        await queryRunner.query(`CREATE INDEX "IDX_3cf600538f83209de39ed03933" ON "inventory_reservations" ("id_item_inventario") `);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" ADD CONSTRAINT "UQ_inventory_reservations_related_entity" UNIQUE ("tipo_entidad_relacionada", "id_entidad_relacionada")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Solo reversible si no hay reservas de apartado todavia (destino sin
        // FK posible en el esquema viejo) -- suficiente para una migracion de
        // desarrollo, nunca se bajo en produccion con datos de ambos origenes.
        await queryRunner.query(`DELETE FROM "inventory_reservations" WHERE "tipo_entidad_relacionada" != 'repair_note_item'`);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" DROP CONSTRAINT "UQ_inventory_reservations_related_entity"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3cf600538f83209de39ed03933"`);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" ADD "id_item_nota_reparacion" bigint`);
        await queryRunner.query(`UPDATE "inventory_reservations" SET "id_item_nota_reparacion" = "id_entidad_relacionada"`);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" ALTER COLUMN "id_item_nota_reparacion" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" DROP COLUMN "id_entidad_relacionada"`);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" DROP COLUMN "tipo_entidad_relacionada"`);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" ADD CONSTRAINT "UQ_104ce622191cb4fe99c37425654" UNIQUE ("id_item_nota_reparacion")`);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" ADD CONSTRAINT "FK_104ce622191cb4fe99c37425654" FOREIGN KEY ("id_item_nota_reparacion") REFERENCES "repair_note_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
