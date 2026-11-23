import { MigrationInterface, QueryRunner } from "typeorm";

// Catálogo de Price de Stripe (modo prueba, cuenta acct_1UapXNQ2ipigtBFR) --
// mismo patrón que CreatePlans: datos de referencia que el código necesita
// para funcionar, no datos de prueba. Montos ya incluyen el 16% de IVA
// (tax_behavior: inclusive en Stripe) -- $249 + IVA = $288.84, etc.
export class CreateStripePrices1795600000008 implements MigrationInterface {
  name = "CreateStripePrices1795600000008";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "stripe_prices" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuidv7(),
            "key" character varying(60) NOT NULL,
            "stripe_price_id" character varying(255) NOT NULL,
            "stripe_product_id" character varying(255) NOT NULL,
            "amount" numeric(10,2) NOT NULL,
            "currency" character varying(3) NOT NULL DEFAULT 'MXN',
            "billing_interval" character varying(10) NOT NULL,
            "messages_granted" integer,
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_stripe_prices_public_id" UNIQUE ("public_id"),
            CONSTRAINT "UQ_stripe_prices_key" UNIQUE ("key"),
            CONSTRAINT "CHK_stripe_prices_billing_interval" CHECK ("billing_interval" IN ('month', 'year', 'one_time')),
            CONSTRAINT "CHK_stripe_prices_messages_granted" CHECK ("messages_granted" IS NULL OR "messages_granted" > 0),
            CONSTRAINT "PK_stripe_prices" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          INSERT INTO "stripe_prices"
            ("key", "stripe_price_id", "stripe_product_id", "amount", "billing_interval", "messages_granted")
          VALUES
            ('plan_basico_monthly', 'price_1UesNHQ2ipigtBFRtD4j4Tt1', 'prod_VgEqZRlGvGjj94', 288.84, 'month', NULL),
            ('plan_basico_yearly', 'price_1UesNIQ2ipigtBFRLXtq02Rm', 'prod_VgEqZRlGvGjj94', 2888.40, 'year', NULL),
            ('plan_crecimiento_monthly', 'price_1UesNIQ2ipigtBFRe70uUvJI', 'prod_VgEqd78kGkgJgM', 520.84, 'month', NULL),
            ('plan_crecimiento_yearly', 'price_1UesNJQ2ipigtBFRTGOnKNgw', 'prod_VgEqd78kGkgJgM', 5208.40, 'year', NULL),
            ('plan_cadena_monthly', 'price_1UesNJQ2ipigtBFRHPq5m4Ya', 'prod_VgEqcUgRWHDK9r', 926.84, 'month', NULL),
            ('plan_cadena_yearly', 'price_1UesNKQ2ipigtBFRgFkYItf2', 'prod_VgEqcUgRWHDK9r', 9268.40, 'year', NULL),
            ('extra_user_monthly', 'price_1UesNKQ2ipigtBFRGuR9PfgU', 'prod_VgEqD7S0Eo3DFI', 68.44, 'month', NULL),
            ('extra_branch_monthly', 'price_1UesNKQ2ipigtBFRoCj94X2s', 'prod_VgEqTxLenDfGHC', 230.84, 'month', NULL),
            ('whatsapp_pack_500', 'price_1UesNLQ2ipigtBFRvJfFk6rS', 'prod_VgEqPiNATCKPuU', 230.84, 'one_time', 500),
            ('whatsapp_pack_1000', 'price_1UesNLQ2ipigtBFRTf8D9BrH', 'prod_VgEqq8h5JbBOSV', 404.84, 'one_time', 1000),
            ('whatsapp_pack_2500', 'price_1UesNMQ2ipigtBFReKK4CW8L', 'prod_VgEqElJIGS47X0', 926.84, 'one_time', 2500)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          DROP TABLE "stripe_prices"
        `);
  }
}
