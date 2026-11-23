import { MigrationInterface, QueryRunner } from "typeorm";

// Sin tenant_id: un evento de Stripe puede llegar antes de poder resolver a
// qué tenant corresponde -- esta tabla solo existe para no procesar el mismo
// evento dos veces (Stripe reintenta si no respondemos 2xx a tiempo).
export class CreateStripeWebhookEvents1795600000011 implements MigrationInterface {
  name = "CreateStripeWebhookEvents1795600000011";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "stripe_webhook_events" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuidv7(),
            "stripe_event_id" character varying(255) NOT NULL,
            "type" character varying(100) NOT NULL,
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_stripe_webhook_events_public_id" UNIQUE ("public_id"),
            CONSTRAINT "UQ_stripe_webhook_events_event_id" UNIQUE ("stripe_event_id"),
            CONSTRAINT "PK_stripe_webhook_events" PRIMARY KEY ("id")
          )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          DROP TABLE "stripe_webhook_events"
        `);
  }
}
