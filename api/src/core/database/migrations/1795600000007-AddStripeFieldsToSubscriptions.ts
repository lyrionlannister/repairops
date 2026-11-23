import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStripeFieldsToSubscriptions1795600000007 implements MigrationInterface {
  name = "AddStripeFieldsToSubscriptions1795600000007";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Hueco entre "se creó el tenant" y "terminó el Checkout de Stripe": todavía
    // sin tarjeta, no es trialing (eso ya implica tarjeta capturada).
    await queryRunner.query(`
          ALTER TYPE "public"."subscription_status" ADD VALUE 'incomplete'
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions" ADD "stripe_customer_id" character varying(255)
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions" ADD "stripe_subscription_id" character varying(255)
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions"
          ADD CONSTRAINT "UQ_subscriptions_stripe_subscription_id" UNIQUE ("stripe_subscription_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions" ADD "stripe_extras_subscription_id" character varying(255)
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions"
          ADD CONSTRAINT "UQ_subscriptions_stripe_extras_subscription_id" UNIQUE ("stripe_extras_subscription_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions" ADD "billing_interval" character varying(10)
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions"
          ADD CONSTRAINT "CHK_subscriptions_billing_interval" CHECK ("billing_interval" IS NULL OR "billing_interval" IN ('month', 'year'))
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions" ADD "current_period_start" TIMESTAMP
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions" ADD "current_period_end" TIMESTAMP
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "subscriptions" DROP COLUMN "current_period_end"
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions" DROP COLUMN "current_period_start"
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions" DROP CONSTRAINT "CHK_subscriptions_billing_interval"
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions" DROP COLUMN "billing_interval"
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions" DROP CONSTRAINT "UQ_subscriptions_stripe_extras_subscription_id"
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions" DROP COLUMN "stripe_extras_subscription_id"
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions" DROP CONSTRAINT "UQ_subscriptions_stripe_subscription_id"
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions" DROP COLUMN "stripe_subscription_id"
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions" DROP COLUMN "stripe_customer_id"
        `);
    // Postgres no soporta DROP VALUE de un enum: se recrea el tipo sin 'incomplete'.
    // Si algún subscription quedó en 'incomplete', este down falla a propósito
    // (USING status::text::subscription_status no tiene a dónde mapearlo).
    await queryRunner.query(`
          ALTER TYPE "public"."subscription_status" RENAME TO "subscription_status_old"
        `);
    await queryRunner.query(`
          CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'canceled')
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions" ALTER COLUMN "status" DROP DEFAULT
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions"
          ALTER COLUMN "status" TYPE "public"."subscription_status" USING "status"::text::"public"."subscription_status"
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'trialing'
        `);
    await queryRunner.query(`
          DROP TYPE "public"."subscription_status_old"
        `);
  }
}
