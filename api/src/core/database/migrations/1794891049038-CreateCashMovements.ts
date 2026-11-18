import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCashMovements1794891049038 implements MigrationInterface {
    name = 'CreateCashMovements1794891049038'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "cash_movements" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "id_sesion_caja" bigint NOT NULL, "tipo" character varying(10) NOT NULL, "metodo" character varying(20) NOT NULL, "monto" numeric(10,2) NOT NULL, "tipo_entidad_relacionada" character varying(20) NOT NULL DEFAULT 'manual', "id_entidad_relacionada" bigint, "nota" text, "id_empleado_creador" bigint, "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7020c352236b752d682896efd52" UNIQUE ("public_id"), CONSTRAINT "PK_25faead19e1ff74153a01604d37" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cash_movements_id_sesion_caja" ON "cash_movements" ("id_sesion_caja") `);
        await queryRunner.query(`CREATE INDEX "IDX_cash_movements_tenant_created" ON "cash_movements" ("tenant_id", "fecha_creacion") `);
        await queryRunner.query(`ALTER TABLE "cash_movements" ADD CONSTRAINT "FK_cash_movements_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cash_movements" ADD CONSTRAINT "FK_cash_movements_id_sesion_caja" FOREIGN KEY ("id_sesion_caja") REFERENCES "cash_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cash_movements" DROP CONSTRAINT "FK_cash_movements_id_sesion_caja"`);
        await queryRunner.query(`ALTER TABLE "cash_movements" DROP CONSTRAINT "FK_cash_movements_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cash_movements_tenant_created"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cash_movements_id_sesion_caja"`);
        await queryRunner.query(`DROP TABLE "cash_movements"`);
    }

}
