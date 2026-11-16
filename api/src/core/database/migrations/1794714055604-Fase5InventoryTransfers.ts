import { MigrationInterface, QueryRunner } from "typeorm";

export class Fase5InventoryTransfers1794714055604 implements MigrationInterface {
    name = 'Fase5InventoryTransfers1794714055604'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "inventory_transfers" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "id_item_origen" bigint NOT NULL, "id_item_destino" bigint NOT NULL, "cantidad" integer NOT NULL, "motivo" text, "id_empleado_creador" bigint, "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1bb6bf0374c196a047dd9ba71f2" UNIQUE ("public_id"), CONSTRAINT "PK_0ab69c36e4239d5db7a3e149c31" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "inventory_transfers" ADD CONSTRAINT "FK_4f7acf010905662915b27aae13b" FOREIGN KEY ("id_item_origen") REFERENCES "inventory_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_transfers" ADD CONSTRAINT "FK_542af38533380b930dbd89fb8f6" FOREIGN KEY ("id_item_destino") REFERENCES "inventory_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_transfers" DROP CONSTRAINT "FK_542af38533380b930dbd89fb8f6"`);
        await queryRunner.query(`ALTER TABLE "inventory_transfers" DROP CONSTRAINT "FK_4f7acf010905662915b27aae13b"`);
        await queryRunner.query(`DROP TABLE "inventory_transfers"`);
    }

}
