import { MigrationInterface, QueryRunner } from "typeorm";

export class Fase5InventoryReservations1794715134618 implements MigrationInterface {
    name = 'Fase5InventoryReservations1794715134618'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "inventory_reservations" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "id_item_nota_reparacion" bigint NOT NULL, "id_item_inventario" bigint NOT NULL, "cantidad" integer NOT NULL, "estado" character varying(10) NOT NULL DEFAULT 'active', "id_movimiento_consumo" bigint, "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(), "fecha_resolucion" TIMESTAMP, CONSTRAINT "UQ_fbc0b3f2cb06418b341a56aef7c" UNIQUE ("public_id"), CONSTRAINT "UQ_104ce622191cb4fe99c37425654" UNIQUE ("id_item_nota_reparacion"), CONSTRAINT "PK_af438c0ce596eea6c4d472a0489" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" ADD CONSTRAINT "FK_104ce622191cb4fe99c37425654" FOREIGN KEY ("id_item_nota_reparacion") REFERENCES "repair_note_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" ADD CONSTRAINT "FK_3cf600538f83209de39ed039339" FOREIGN KEY ("id_item_inventario") REFERENCES "inventory_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" ADD CONSTRAINT "FK_e1ad789e81c1a0176f9017720a5" FOREIGN KEY ("id_movimiento_consumo") REFERENCES "inventory_movements"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_reservations" DROP CONSTRAINT "FK_e1ad789e81c1a0176f9017720a5"`);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" DROP CONSTRAINT "FK_3cf600538f83209de39ed039339"`);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" DROP CONSTRAINT "FK_104ce622191cb4fe99c37425654"`);
        await queryRunner.query(`DROP TABLE "inventory_reservations"`);
    }

}
