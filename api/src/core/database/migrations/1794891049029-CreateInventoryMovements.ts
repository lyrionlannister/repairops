import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInventoryMovements1794891049029 implements MigrationInterface {
    name = 'CreateInventoryMovements1794891049029'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "inventory_movements" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "id_item_inventario" bigint NOT NULL, "tipo" character varying(20) NOT NULL, "cantidad" integer NOT NULL, "motivo" character varying(255), "tipo_entidad_relacionada" character varying(20) NOT NULL DEFAULT 'manual', "id_entidad_relacionada" bigint, "id_empleado_creador" bigint, "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_411c1251b97c4d80613c24c247a" UNIQUE ("public_id"), CONSTRAINT "PK_d7597827c1dcffae889db3ab873" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_inventory_movements_tenant" ON "inventory_movements" ("tenant_id") `);
        await queryRunner.query(`ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_inventory_movements_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_inventory_movements_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_inventory_movements_tenant"`);
        await queryRunner.query(`DROP TABLE "inventory_movements"`);
    }

}
