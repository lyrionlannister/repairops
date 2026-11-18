import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInventoryCounts1794891049049 implements MigrationInterface {
    name = 'CreateInventoryCounts1794891049049'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "inventory_counts" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "branch_id" bigint NOT NULL, "estado" character varying(10) NOT NULL DEFAULT 'open', "id_empleado_apertura" bigint, "id_empleado_cierre" bigint, "fecha_apertura" TIMESTAMP NOT NULL DEFAULT now(), "fecha_cierre" TIMESTAMP, CONSTRAINT "UQ_16bb7bf2f2b0e65d7b17e3e0083" UNIQUE ("public_id"), CONSTRAINT "PK_8230343330002d07a2efb485680" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_inventory_counts_tenant" ON "inventory_counts" ("tenant_id") `);
        await queryRunner.query(`ALTER TABLE "inventory_counts" ADD CONSTRAINT "FK_inventory_counts_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_counts" ADD CONSTRAINT "FK_599df759f26903c0fd28c0cc8cf" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_counts" DROP CONSTRAINT "FK_599df759f26903c0fd28c0cc8cf"`);
        await queryRunner.query(`ALTER TABLE "inventory_counts" DROP CONSTRAINT "FK_inventory_counts_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_inventory_counts_tenant"`);
        await queryRunner.query(`DROP TABLE "inventory_counts"`);
    }

}
