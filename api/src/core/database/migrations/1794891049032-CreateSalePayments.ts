import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSalePayments1794891049032 implements MigrationInterface {
    name = 'CreateSalePayments1794891049032'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sale_payments" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "id_venta" bigint NOT NULL, "metodo" character varying(20) NOT NULL, "monto" numeric(10,2) NOT NULL, "referencia_proveedor" character varying(255), "codigo_autorizacion_proveedor" character varying(100), CONSTRAINT "UQ_73d2296fa8ad6de7f248fbd70c1" UNIQUE ("public_id"), CONSTRAINT "PK_1117d02608a00d131b95f60a58e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_sale_payments_id_venta" ON "sale_payments" ("id_venta") `);
        await queryRunner.query(`CREATE INDEX "IDX_sale_payments_tenant" ON "sale_payments" ("tenant_id") `);
        await queryRunner.query(`ALTER TABLE "sale_payments" ADD CONSTRAINT "FK_sale_payments_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sale_payments" ADD CONSTRAINT "FK_sale_payments_id_venta" FOREIGN KEY ("id_venta") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sale_payments" DROP CONSTRAINT "FK_sale_payments_id_venta"`);
        await queryRunner.query(`ALTER TABLE "sale_payments" DROP CONSTRAINT "FK_sale_payments_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sale_payments_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sale_payments_id_venta"`);
        await queryRunner.query(`DROP TABLE "sale_payments"`);
    }

}
