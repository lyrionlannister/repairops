import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLayawayItems1794891049053 implements MigrationInterface {
    name = 'CreateLayawayItems1794891049053'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "layaway_items" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "id_apartado" bigint NOT NULL, "id_item_inventario" bigint NOT NULL, "cantidad" integer NOT NULL, "precio_unitario" numeric(10,2) NOT NULL, CONSTRAINT "UQ_606e2bc7c7861759f19d3a0dda6" UNIQUE ("public_id"), CONSTRAINT "PK_dd11f48117ca3ff72dd41570913" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_layaway_items_tenant" ON "layaway_items" ("tenant_id") `);
        await queryRunner.query(`ALTER TABLE "layaway_items" ADD CONSTRAINT "FK_layaway_items_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "layaway_items" ADD CONSTRAINT "FK_076f2e9c0960a41a192c9fdb246" FOREIGN KEY ("id_apartado") REFERENCES "layaways"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "layaway_items" ADD CONSTRAINT "FK_27c39dd59e9da87938aa630b354" FOREIGN KEY ("id_item_inventario") REFERENCES "inventory_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "layaway_items" DROP CONSTRAINT "FK_27c39dd59e9da87938aa630b354"`);
        await queryRunner.query(`ALTER TABLE "layaway_items" DROP CONSTRAINT "FK_076f2e9c0960a41a192c9fdb246"`);
        await queryRunner.query(`ALTER TABLE "layaway_items" DROP CONSTRAINT "FK_layaway_items_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_layaway_items_tenant"`);
        await queryRunner.query(`DROP TABLE "layaway_items"`);
    }

}
