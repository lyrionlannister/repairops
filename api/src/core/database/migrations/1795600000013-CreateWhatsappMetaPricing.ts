import { MigrationInterface, QueryRunner } from "typeorm";

// Catálogo de costo por categoría de conversación de Meta, sin tenant_id --
// mismo patrón que `stripe_prices`. Valores sembrados: terceros (no la página
// oficial de Meta) reportan para México, vigente desde oct-2026, marketing
// $0.0397 USD/mensaje y utility/authentication/service $0.0085 USD/mensaje
// cada una (servicio tiene además 1,000 mensajes gratis/mes por número, no
// modelado aquí). Verificar contra Meta Business Manager > WhatsApp Manager >
// Pricing antes de usar para contabilidad real -- actualizar esta tabla a
// mano si cambia, nunca hardcodear el monto en código.
export class CreateWhatsappMetaPricing1795600000013 implements MigrationInterface {
  name = "CreateWhatsappMetaPricing1795600000013";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "whatsapp_meta_pricing" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuidv7(),
            "category" character varying(30) NOT NULL,
            "cost_usd" numeric(10,4) NOT NULL,
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            "fecha_actualizacion" TIMESTAMP DEFAULT now(),
            CONSTRAINT "UQ_whatsapp_meta_pricing_public_id" UNIQUE ("public_id"),
            CONSTRAINT "UQ_whatsapp_meta_pricing_category" UNIQUE ("category"),
            CONSTRAINT "CHK_whatsapp_meta_pricing_category" CHECK ("category" IN ('marketing', 'utility', 'authentication', 'service')),
            CONSTRAINT "PK_whatsapp_meta_pricing" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          INSERT INTO "whatsapp_meta_pricing" ("category", "cost_usd")
          VALUES
            ('marketing', 0.0397),
            ('utility', 0.0085),
            ('authentication', 0.0085),
            ('service', 0.0085)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          DROP TABLE "whatsapp_meta_pricing"
        `);
  }
}
