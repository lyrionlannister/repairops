import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateReturnItems1794891049047 implements MigrationInterface {
    name = 'CreateReturnItems1794891049047'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "return_items" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "id_devolucion" bigint NOT NULL, "id_item_venta" bigint NOT NULL, "cantidad" integer NOT NULL, "monto_reembolsado" numeric(10,2) NOT NULL, CONSTRAINT "UQ_590242cd316d14b7977c04769e7" UNIQUE ("public_id"), CONSTRAINT "PK_6e6c1db00d31ab59c1bc22f6cb9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_return_items_tenant" ON "return_items" ("tenant_id") `);
        await queryRunner.query(`ALTER TABLE "return_items" ADD CONSTRAINT "FK_return_items_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "return_items" ADD CONSTRAINT "FK_e8b36c538cf6bf38958409d554b" FOREIGN KEY ("id_devolucion") REFERENCES "returns"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "return_items" ADD CONSTRAINT "FK_aa73cf3448068f9ca00bd9861c7" FOREIGN KEY ("id_item_venta") REFERENCES "sale_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "return_items" DROP CONSTRAINT "FK_aa73cf3448068f9ca00bd9861c7"`);
        await queryRunner.query(`ALTER TABLE "return_items" DROP CONSTRAINT "FK_e8b36c538cf6bf38958409d554b"`);
        await queryRunner.query(`ALTER TABLE "return_items" DROP CONSTRAINT "FK_return_items_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_return_items_tenant"`);
        await queryRunner.query(`DROP TABLE "return_items"`);
    }

}
