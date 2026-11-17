import { MigrationInterface, QueryRunner } from "typeorm";

export class LocalBrandColor1794885126182 implements MigrationInterface {
    name = 'LocalBrandColor1794885126182'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "local_config" ADD "color_marca" character varying(7)`);
        await queryRunner.query(`ALTER TABLE "local_config" ADD CONSTRAINT "CHK_local_config_color_marca" CHECK ("color_marca" IS NULL OR "color_marca" ~ '^#[0-9a-f]{6}$')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "local_config" DROP CONSTRAINT "CHK_local_config_color_marca"`);
        await queryRunner.query(`ALTER TABLE "local_config" DROP COLUMN "color_marca"`);
    }

}
