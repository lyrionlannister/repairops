import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSubscriptions1794891049056 implements MigrationInterface {
  name = "CreateSubscriptions1794891049056";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'canceled')
        `);
    await queryRunner.query(`
          CREATE TABLE "subscriptions" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "plan_id" bigint NOT NULL,
            "status" "public"."subscription_status" NOT NULL DEFAULT 'trialing',
            "extra_users" integer NOT NULL DEFAULT '0',
            "extra_branches" integer NOT NULL DEFAULT '0',
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            "fecha_actualizacion" TIMESTAMP DEFAULT now(),
            CONSTRAINT "UQ_62f3489de40c61683940cfc31b6" UNIQUE ("public_id"),
            CONSTRAINT "UQ_f6ac03431c311ccb8bbd7d3af18" UNIQUE ("tenant_id"),
            CONSTRAINT "CHK_subscriptions_extras" CHECK ("extra_users" >= 0 AND "extra_branches" >= 0),
            CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions"
          ADD CONSTRAINT "FK_subscriptions_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions"
          ADD CONSTRAINT "FK_subscriptions_plan" FOREIGN KEY ("plan_id") REFERENCES "plans" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "subscriptions"
          DROP CONSTRAINT "FK_subscriptions_plan"
        `);
    await queryRunner.query(`
          ALTER TABLE "subscriptions"
          DROP CONSTRAINT "FK_subscriptions_tenant"
        `);
    await queryRunner.query(`
          DROP TABLE "subscriptions"
        `);
    await queryRunner.query(`
          DROP TYPE "public"."subscription_status"
        `);
  }
}
