import { MigrationInterface, QueryRunner } from "typeorm";

export class DashboardIndexes1794886066315 implements MigrationInterface {
    name = 'DashboardIndexes1794886066315'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "local_config" ADD "zona_horaria" character varying(64) NOT NULL DEFAULT 'America/Mexico_City'`);
        await queryRunner.query(`CREATE INDEX "IDX_repair_notes_tenant_status" ON "repair_notes" ("tenant_id", "estado") `);
        await queryRunner.query(`CREATE INDEX "IDX_repair_notes_tenant_received" ON "repair_notes" ("tenant_id", "fecha_recepcion") `);
        await queryRunner.query(`CREATE INDEX "IDX_sales_tenant_created" ON "sales" ("tenant_id", "fecha_creacion") `);
        await queryRunner.query(`CREATE INDEX "IDX_cash_movements_tenant_created" ON "cash_movements" ("tenant_id", "fecha_creacion") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_cash_movements_tenant_created"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sales_tenant_created"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_repair_notes_tenant_received"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_repair_notes_tenant_status"`);
        await queryRunner.query(`ALTER TABLE "local_config" DROP COLUMN "zona_horaria"`);
    }

}
