import { MigrationInterface, QueryRunner } from "typeorm";

export class Fase5CustomerCreditLimit1794716092346 implements MigrationInterface {
    name = 'Fase5CustomerCreditLimit1794716092346'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ADD "limite_credito" numeric(10,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "limite_credito"`);
    }

}
