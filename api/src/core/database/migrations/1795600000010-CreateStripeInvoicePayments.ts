import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStripeInvoicePayments1795600000010 implements MigrationInterface {
  name = "CreateStripeInvoicePayments1795600000010";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "stripe_invoice_payments" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuidv7(),
            "tenant_id" bigint NOT NULL,
            "stripe_invoice_id" character varying(255) NOT NULL,
            "plan_key" character varying(30) NOT NULL,
            "billing_interval" character varying(10) NOT NULL,
            "amount" numeric(10,2) NOT NULL,
            "currency" character varying(3) NOT NULL DEFAULT 'MXN',
            "paid_at" TIMESTAMP NOT NULL,
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_stripe_invoice_payments_public_id" UNIQUE ("public_id"),
            CONSTRAINT "UQ_stripe_invoice_payments_invoice" UNIQUE ("stripe_invoice_id"),
            CONSTRAINT "PK_stripe_invoice_payments" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          ALTER TABLE "stripe_invoice_payments"
          ADD CONSTRAINT "FK_stripe_invoice_payments_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_stripe_invoice_payments_tenant" ON "stripe_invoice_payments" ("tenant_id")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          DROP INDEX IF EXISTS "IDX_stripe_invoice_payments_tenant"
        `);
    await queryRunner.query(`
          ALTER TABLE "stripe_invoice_payments" DROP CONSTRAINT "FK_stripe_invoice_payments_tenant"
        `);
    await queryRunner.query(`
          DROP TABLE "stripe_invoice_payments"
        `);
  }
}
