import { MigrationInterface, QueryRunner } from "typeorm";

export class Fase1RolesStockMonedaFormatos1794469474730 implements MigrationInterface {
    name = 'Fase1RolesStockMonedaFormatos1794469474730'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "local_config" ADD "moneda" character varying(3) NOT NULL DEFAULT 'MXN'`);
        await queryRunner.query(`ALTER TABLE "local_config" ADD "formato_ticket" character varying(10) NOT NULL DEFAULT '80mm'`);
        await queryRunner.query(`ALTER TABLE "local_config" ADD "clausula_garantia" text`);
        await queryRunner.query(`ALTER TABLE "inventory_items" ADD "stock_minimo" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_items" DROP COLUMN "stock_minimo"`);
        await queryRunner.query(`ALTER TABLE "local_config" DROP COLUMN "clausula_garantia"`);
        await queryRunner.query(`ALTER TABLE "local_config" DROP COLUMN "formato_ticket"`);
        await queryRunner.query(`ALTER TABLE "local_config" DROP COLUMN "moneda"`);
    }

}
