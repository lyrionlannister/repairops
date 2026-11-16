import { MigrationInterface, QueryRunner } from "typeorm";

export class Fase5Returns1794712281483 implements MigrationInterface {
    name = 'Fase5Returns1794712281483'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "returns" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "id_venta" bigint NOT NULL, "numero_devolucion" integer NOT NULL, "id_sesion_caja" bigint NOT NULL, "metodo_reembolso" character varying(20) NOT NULL, "motivo" text NOT NULL, "monto_reembolsado" numeric(10,2) NOT NULL, "id_empleado_creador" bigint, "idempotency_key" character varying(100), "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d349ffae997bbb0f42a29ecd3bb" UNIQUE ("public_id"), CONSTRAINT "UQ_98904d7c3178232e5367628eebe" UNIQUE ("tenant_id", "idempotency_key"), CONSTRAINT "UQ_0c5915dcbce4f293ce0b917bfe5" UNIQUE ("tenant_id", "numero_devolucion"), CONSTRAINT "PK_27a2f1895a71519ebfec7850361" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "return_items" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "id_devolucion" bigint NOT NULL, "id_item_venta" bigint NOT NULL, "cantidad" integer NOT NULL, "monto_reembolsado" numeric(10,2) NOT NULL, CONSTRAINT "UQ_590242cd316d14b7977c04769e7" UNIQUE ("public_id"), CONSTRAINT "PK_6e6c1db00d31ab59c1bc22f6cb9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "local_config" ADD "siguiente_numero_devolucion" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "returns" ADD CONSTRAINT "FK_1d6aaa8ce9253f8012187246b26" FOREIGN KEY ("id_venta") REFERENCES "sales"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "return_items" ADD CONSTRAINT "FK_e8b36c538cf6bf38958409d554b" FOREIGN KEY ("id_devolucion") REFERENCES "returns"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "return_items" ADD CONSTRAINT "FK_aa73cf3448068f9ca00bd9861c7" FOREIGN KEY ("id_item_venta") REFERENCES "sale_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "return_items" DROP CONSTRAINT "FK_aa73cf3448068f9ca00bd9861c7"`);
        await queryRunner.query(`ALTER TABLE "return_items" DROP CONSTRAINT "FK_e8b36c538cf6bf38958409d554b"`);
        await queryRunner.query(`ALTER TABLE "returns" DROP CONSTRAINT "FK_1d6aaa8ce9253f8012187246b26"`);
        await queryRunner.query(`ALTER TABLE "local_config" DROP COLUMN "siguiente_numero_devolucion"`);
        await queryRunner.query(`DROP TABLE "return_items"`);
        await queryRunner.query(`DROP TABLE "returns"`);
    }

}
