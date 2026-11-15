import { MigrationInterface, QueryRunner } from "typeorm";

export class Fase2PosNucleo1794501084534 implements MigrationInterface {
    name = 'Fase2PosNucleo1794501084534'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sale_payments" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "id_venta" bigint NOT NULL, "metodo" character varying(20) NOT NULL, "monto" numeric(10,2) NOT NULL, "referencia_proveedor" character varying(255), "codigo_autorizacion_proveedor" character varying(100), CONSTRAINT "UQ_73d2296fa8ad6de7f248fbd70c1" UNIQUE ("public_id"), CONSTRAINT "PK_1117d02608a00d131b95f60a58e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "metodo_pago"`);
        await queryRunner.query(`ALTER TABLE "sale_items" DROP COLUMN "id_item_inventario"`);
        await queryRunner.query(`ALTER TABLE "local_config" ADD "siguiente_numero_venta" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "local_config" ADD "tasa_impuesto" numeric(5,2) NOT NULL DEFAULT '16'`);
        await queryRunner.query(`ALTER TABLE "local_config" ADD "tope_descuento_por_rol" jsonb NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "sales" ADD "numero_venta" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sales" ADD "customer_id" bigint`);
        await queryRunner.query(`ALTER TABLE "sales" ADD "id_sesion_caja" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sales" ADD "origen" character varying(20) NOT NULL DEFAULT 'counter'`);
        await queryRunner.query(`ALTER TABLE "sales" ADD "subtotal" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sales" ADD "monto_descuento" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "sales" ADD "monto_impuesto" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "sales" ADD "idempotency_key" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "UQ_7e4b24f1763de13f8f03ba89fd8" UNIQUE ("idempotency_key")`);
        await queryRunner.query(`ALTER TABLE "sale_items" ADD "tipo_linea" character varying(20) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sale_items" ADD "id_referencia" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sale_items" ADD "monto_descuento" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "UQ_0ce3fad2854fe53ff537b1743d6" UNIQUE ("tenant_id", "numero_venta")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "UQ_0ce3fad2854fe53ff537b1743d6"`);
        await queryRunner.query(`ALTER TABLE "sale_items" DROP COLUMN "monto_descuento"`);
        await queryRunner.query(`ALTER TABLE "sale_items" DROP COLUMN "id_referencia"`);
        await queryRunner.query(`ALTER TABLE "sale_items" DROP COLUMN "tipo_linea"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "UQ_7e4b24f1763de13f8f03ba89fd8"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "idempotency_key"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "monto_impuesto"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "monto_descuento"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "subtotal"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "origen"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "id_sesion_caja"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "customer_id"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "numero_venta"`);
        await queryRunner.query(`ALTER TABLE "local_config" DROP COLUMN "tope_descuento_por_rol"`);
        await queryRunner.query(`ALTER TABLE "local_config" DROP COLUMN "tasa_impuesto"`);
        await queryRunner.query(`ALTER TABLE "local_config" DROP COLUMN "siguiente_numero_venta"`);
        await queryRunner.query(`ALTER TABLE "sale_items" ADD "id_item_inventario" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sales" ADD "metodo_pago" character varying(20) NOT NULL`);
        await queryRunner.query(`DROP TABLE "sale_payments"`);
    }

}
