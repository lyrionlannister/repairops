import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSales1794891049030 implements MigrationInterface {
  name = "CreateSales1794891049030";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "sales" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "local_id" bigint NOT NULL,
            "numero_venta" integer NOT NULL,
            "customer_id" bigint,
            "nombre_cliente" character varying(255),
            "id_sesion_caja" bigint NOT NULL,
            "origen" character varying(20) NOT NULL DEFAULT 'counter',
            "subtotal" numeric(10, 2) NOT NULL,
            "monto_descuento" numeric(10, 2) NOT NULL DEFAULT '0',
            "monto_impuesto" numeric(10, 2) NOT NULL DEFAULT '0',
            "valor_total" numeric(10, 2) NOT NULL,
            "id_empleado_creador" bigint,
            "idempotency_key" character varying(100),
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_59339e19cf1c8c4d93f8c593f2f" UNIQUE ("public_id"),
            CONSTRAINT "UQ_7fe776f75472f53a7aad117ccf5" UNIQUE ("tenant_id", "idempotency_key"),
            CONSTRAINT "UQ_0ce3fad2854fe53ff537b1743d6" UNIQUE ("tenant_id", "numero_venta"),
            CONSTRAINT "PK_4f0bc990ae81dba46da680895ea" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_sales_local" ON "sales" ("local_id")
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_sales_tenant_created" ON "sales" ("tenant_id", "fecha_creacion")
        `);
    await queryRunner.query(`
          ALTER TABLE "sales"
          ADD CONSTRAINT "FK_sales_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "sales"
          ADD CONSTRAINT "FK_sales_local" FOREIGN KEY ("local_id") REFERENCES "branches" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "sales"
          DROP CONSTRAINT "FK_sales_local"
        `);
    await queryRunner.query(`
          ALTER TABLE "sales"
          DROP CONSTRAINT "FK_sales_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_sales_tenant_created"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_sales_local"
        `);
    await queryRunner.query(`
          DROP TABLE "sales"
        `);
  }
}
