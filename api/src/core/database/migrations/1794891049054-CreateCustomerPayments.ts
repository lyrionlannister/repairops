import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCustomerPayments1794891049054 implements MigrationInterface {
  name = "CreateCustomerPayments1794891049054";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "customer_payments" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "local_id" bigint NOT NULL,
            "id_cliente" bigint NOT NULL,
            "monto" numeric(10, 2) NOT NULL,
            "metodo" character varying(20) NOT NULL,
            "id_empleado" bigint,
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_93f0aafab62d25a3ae2140d6c07" UNIQUE ("public_id"),
            CONSTRAINT "PK_49f9fc4bd44d957db20148928d1" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_customer_payments_cliente" ON "customer_payments" ("id_cliente")
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_customer_payments_tenant" ON "customer_payments" ("tenant_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "customer_payments"
          ADD CONSTRAINT "FK_customer_payments_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "customer_payments"
          ADD CONSTRAINT "FK_customer_payments_local" FOREIGN KEY ("local_id") REFERENCES "branches" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "customer_payments"
          ADD CONSTRAINT "FK_customer_payments_id_cliente" FOREIGN KEY ("id_cliente") REFERENCES "customers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "customer_payments"
          DROP CONSTRAINT "FK_customer_payments_id_cliente"
        `);
    await queryRunner.query(`
          ALTER TABLE "customer_payments"
          DROP CONSTRAINT "FK_customer_payments_local"
        `);
    await queryRunner.query(`
          ALTER TABLE "customer_payments"
          DROP CONSTRAINT "FK_customer_payments_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_customer_payments_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_customer_payments_cliente"
        `);
    await queryRunner.query(`
          DROP TABLE "customer_payments"
        `);
  }
}
