import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSupplierToInventoryItems1794780009074 implements MigrationInterface {
    name = 'AddSupplierToInventoryItems1794780009074'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_items" ADD "id_proveedor" bigint`);
        await queryRunner.query(`ALTER TABLE "inventory_items" ADD CONSTRAINT "FK_03a8eb63a3da0a283b845cf75a0" FOREIGN KEY ("id_proveedor") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_items" DROP CONSTRAINT "FK_03a8eb63a3da0a283b845cf75a0"`);
        await queryRunner.query(`ALTER TABLE "inventory_items" DROP COLUMN "id_proveedor"`);
    }

}
