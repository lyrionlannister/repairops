import { MigrationInterface, QueryRunner } from "typeorm";

export class Fase3CierreCajaConVarianza1794504627228 implements MigrationInterface {
    name = 'Fase3CierreCajaConVarianza1794504627228'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "local_config" ADD "tope_diferencia_caja_sin_autorizar" numeric(10,2) NOT NULL DEFAULT '50'`);
        await queryRunner.query(`ALTER TABLE "cash_sessions" ADD "diferencia" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "cash_sessions" ADD "motivo_diferencia" text`);
        await queryRunner.query(`ALTER TABLE "cash_sessions" ADD "id_empleado_autoriza_diferencia" bigint`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cash_sessions" DROP COLUMN "id_empleado_autoriza_diferencia"`);
        await queryRunner.query(`ALTER TABLE "cash_sessions" DROP COLUMN "motivo_diferencia"`);
        await queryRunner.query(`ALTER TABLE "cash_sessions" DROP COLUMN "diferencia"`);
        await queryRunner.query(`ALTER TABLE "local_config" DROP COLUMN "tope_diferencia_caja_sin_autorizar"`);
    }

}
