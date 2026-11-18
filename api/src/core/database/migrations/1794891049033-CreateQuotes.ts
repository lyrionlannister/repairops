import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateQuotes1794891049033 implements MigrationInterface {
    name = 'CreateQuotes1794891049033'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "quotes" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "local_id" bigint NOT NULL, "tipo" character varying(20) NOT NULL DEFAULT 'product', "customer_id" bigint, "nombre_cliente" character varying(255) NOT NULL, "numero_contacto" character varying(50), "marca" character varying(255), "modelo" character varying(255), "falla_reportada" text, "id_nota_reparacion" bigint, "valor_total" numeric(10,2) NOT NULL DEFAULT '0', "valido_hasta" date, "estado" character varying(20) NOT NULL DEFAULT 'pending', "id_empleado_creador" bigint, "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP DEFAULT now(), CONSTRAINT "UQ_ef0c29c6b71179bdbfe8754fde1" UNIQUE ("public_id"), CONSTRAINT "CHK_quotes_tipo" CHECK ("tipo" IN ('product', 'repair')), CONSTRAINT "CHK_quotes_reparacion_datos" CHECK ("tipo" = 'product' OR ("marca" IS NOT NULL AND "modelo" IS NOT NULL AND "falla_reportada" IS NOT NULL)), CONSTRAINT "PK_99a0e8bcbcd8719d3a41f23c263" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_quotes_local" ON "quotes" ("local_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_quotes_tenant" ON "quotes" ("tenant_id") `);
        await queryRunner.query(`ALTER TABLE "quotes" ADD CONSTRAINT "FK_quotes_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quotes" ADD CONSTRAINT "FK_quotes_local" FOREIGN KEY ("local_id") REFERENCES "branches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quotes" ADD CONSTRAINT "FK_quotes_id_nota_reparacion" FOREIGN KEY ("id_nota_reparacion") REFERENCES "repair_notes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quotes" DROP CONSTRAINT "FK_quotes_id_nota_reparacion"`);
        await queryRunner.query(`ALTER TABLE "quotes" DROP CONSTRAINT "FK_quotes_local"`);
        await queryRunner.query(`ALTER TABLE "quotes" DROP CONSTRAINT "FK_quotes_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_quotes_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_quotes_local"`);
        await queryRunner.query(`DROP TABLE "quotes"`);
    }

}
