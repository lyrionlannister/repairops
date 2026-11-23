import { MigrationInterface, QueryRunner } from "typeorm";

// Onboarding nuevo: el registro público ya no elige plan de una -- crea la
// Subscription en 'incomplete' sin plan todavía; el owner lo elige después
// (cards post-registro) y ahí se recién crea el Checkout de Stripe.
export class SubscriptionPlanOptional1795600000012 implements MigrationInterface {
  name = "SubscriptionPlanOptional1795600000012";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "subscriptions" ALTER COLUMN "plan_id" DROP NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Si algún subscription quedó sin plan, este down falla a propósito
    // (no hay un plan "correcto" al que asignarlo retroactivamente).
    await queryRunner.query(`
          ALTER TABLE "subscriptions" ALTER COLUMN "plan_id" SET NOT NULL
        `);
  }
}
