import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRevenueAttributionSettings1794891049039 implements MigrationInterface {
    name = 'CreateRevenueAttributionSettings1794891049039'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "revenue_attribution_settings" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "base_atribucion" character varying(20) NOT NULL DEFAULT 'total_value', "fecha_actualizacion" TIMESTAMP DEFAULT now(), CONSTRAINT "UQ_29e35365e6e1f9d233395b47ccc" UNIQUE ("public_id"), CONSTRAINT "UQ_7574437ac81328beacc9df3cbdb" UNIQUE ("tenant_id"), CONSTRAINT "PK_02e74cb32a9789b3d64b88e2742" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "revenue_attribution_settings" ADD CONSTRAINT "FK_revenue_attribution_settings_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "revenue_attribution_settings" DROP CONSTRAINT "FK_revenue_attribution_settings_tenant"`);
        await queryRunner.query(`DROP TABLE "revenue_attribution_settings"`);
    }

}
