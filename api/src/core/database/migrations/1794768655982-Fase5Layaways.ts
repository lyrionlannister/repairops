import { MigrationInterface, QueryRunner } from "typeorm";

export class Fase5Layaways1794768655982 implements MigrationInterface {
    name = 'Fase5Layaways1794768655982'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "layaways" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "id_cliente" bigint NOT NULL, "estado" character varying(10) NOT NULL DEFAULT 'open', "valor_total" numeric(10,2) NOT NULL, "monto_anticipo" numeric(10,2) NOT NULL, "metodo_anticipo" character varying(20) NOT NULL, "fecha_vencimiento" date NOT NULL, "id_empleado_creador" bigint, "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(), "fecha_completado" TIMESTAMP, "fecha_cancelado" TIMESTAMP, "fecha_vencido" TIMESTAMP, CONSTRAINT "UQ_9f074cefa866dd31b2889cdfad3" UNIQUE ("public_id"), CONSTRAINT "PK_267e667e4f10178d47a515f8ae5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "layaway_items" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "id_apartado" bigint NOT NULL, "id_item_inventario" bigint NOT NULL, "cantidad" integer NOT NULL, "precio_unitario" numeric(10,2) NOT NULL, CONSTRAINT "UQ_606e2bc7c7861759f19d3a0dda6" UNIQUE ("public_id"), CONSTRAINT "PK_dd11f48117ca3ff72dd41570913" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "layaways" ADD CONSTRAINT "FK_835f50e4df71c02e6068905f416" FOREIGN KEY ("id_cliente") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "layaway_items" ADD CONSTRAINT "FK_076f2e9c0960a41a192c9fdb246" FOREIGN KEY ("id_apartado") REFERENCES "layaways"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "layaway_items" ADD CONSTRAINT "FK_27c39dd59e9da87938aa630b354" FOREIGN KEY ("id_item_inventario") REFERENCES "inventory_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "layaway_items" DROP CONSTRAINT "FK_27c39dd59e9da87938aa630b354"`);
        await queryRunner.query(`ALTER TABLE "layaway_items" DROP CONSTRAINT "FK_076f2e9c0960a41a192c9fdb246"`);
        await queryRunner.query(`ALTER TABLE "layaways" DROP CONSTRAINT "FK_835f50e4df71c02e6068905f416"`);
        await queryRunner.query(`DROP TABLE "layaway_items"`);
        await queryRunner.query(`DROP TABLE "layaways"`);
    }

}
