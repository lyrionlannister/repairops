import { MigrationInterface, QueryRunner } from "typeorm";

// Checkpoint 7 de Fase 4 (ver tasks/plan.md): el catalogo de plantillas deja
// de ser un arreglo hardcodeado (templates/catalog.ts) y pasa a una tabla
// real, administrable desde UI, con dos duenos posibles (tenant_id NULL =
// fila "de sistema", no NULL = fila de un tenant/"empresa"). Esta migracion
// se escribio a mano (no via `migration:generate` -- el CLI de TypeORM no
// corre en este host con Node 24, ver nota en tasks/plan.md) porque el
// backfill de los datos existentes no es algo que un diff automatico pueda
// generar: cada fila de `whatsapp_template_statuses` con
// `catalog_key = 'order_ready'` necesita su `WhatsappTemplateCatalogEntry`
// equivalente antes de poder cambiar la columna suelta por una FK real.
export class Fase4WhatsappTemplateCatalog1794600300000 implements MigrationInterface {
    name = 'Fase4WhatsappTemplateCatalog1794600300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "whatsapp_template_category" AS ENUM('UTILITY', 'MARKETING', 'AUTHENTICATION')`);

        await queryRunner.query(`CREATE TABLE "whatsapp_template_catalog_entries" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint,
            "key" character varying(100) NOT NULL,
            "meta_name" character varying(100) NOT NULL,
            "category" "whatsapp_template_category" NOT NULL,
            "language" character varying(20) NOT NULL,
            "text" text NOT NULL,
            "variables" jsonb NOT NULL DEFAULT '[]',
            "trigger_event" character varying(100),
            "enabled" boolean NOT NULL DEFAULT true,
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            "fecha_actualizacion" TIMESTAMP DEFAULT now(),
            CONSTRAINT "UQ_wa_template_catalog_public_id" UNIQUE ("public_id"),
            CONSTRAINT "UQ_wa_template_catalog_tenant_key" UNIQUE ("tenant_id", "key"),
            CONSTRAINT "UQ_wa_template_catalog_tenant_meta_name" UNIQUE ("tenant_id", "meta_name"),
            CONSTRAINT "PK_wa_template_catalog_id" PRIMARY KEY ("id")
        )`);

        // Dos NULL nunca son iguales para el UNIQUE(tenant_id, key) de arriba
        // -- sin estos indices parciales, dos filas "de sistema" podrian
        // repetir la misma key/meta_name sin que la DB lo note.
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_wa_template_catalog_system_key" ON "whatsapp_template_catalog_entries" ("key") WHERE "tenant_id" IS NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_wa_template_catalog_system_meta_name" ON "whatsapp_template_catalog_entries" ("meta_name") WHERE "tenant_id" IS NULL`);

        await queryRunner.query(`ALTER TABLE "usuarios" ADD "es_platform_admin" boolean NOT NULL DEFAULT false`);

        // Backfill: una WhatsappTemplateCatalogEntry de empresa por cada
        // tenant que ya tenia una fila `order_ready` -- mismos valores que
        // templates/catalog.ts tenia en codigo.
        await queryRunner.query(`
            INSERT INTO "whatsapp_template_catalog_entries"
                ("tenant_id", "key", "meta_name", "category", "language", "text", "variables", "trigger_event", "enabled")
            SELECT DISTINCT "tenant_id", 'order_ready', 'orden_lista_recoger', 'UTILITY'::"whatsapp_template_category", 'es_MX',
                'Hola {{nombre}}, tu equipo {{modelo}} ya está listo para recoger en nuestra sucursal.',
                '["nombre", "modelo"]'::jsonb, 'repair_note.status_changed_to_terminada', true
            FROM "whatsapp_template_statuses"
            WHERE "catalog_key" = 'order_ready'
        `);

        await queryRunner.query(`ALTER TABLE "whatsapp_template_statuses" ADD "catalog_entry_id" bigint`);
        await queryRunner.query(`
            UPDATE "whatsapp_template_statuses" AS s
            SET "catalog_entry_id" = c."id"
            FROM "whatsapp_template_catalog_entries" AS c
            WHERE c."tenant_id" = s."tenant_id" AND c."key" = s."catalog_key"
        `);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_statuses" ALTER COLUMN "catalog_entry_id" SET NOT NULL`);

        await queryRunner.query(`ALTER TABLE "whatsapp_template_statuses" DROP CONSTRAINT "UQ_wa_template_statuses_tenant_catalog"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_statuses" DROP COLUMN "catalog_key"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_statuses" ADD CONSTRAINT "UQ_wa_template_statuses_tenant_catalog_entry" UNIQUE ("tenant_id", "catalog_entry_id")`);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_statuses" ADD CONSTRAINT "FK_wa_template_statuses_catalog_entry" FOREIGN KEY ("catalog_entry_id") REFERENCES "whatsapp_template_catalog_entries"("id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "whatsapp_template_statuses" DROP CONSTRAINT "FK_wa_template_statuses_catalog_entry"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_statuses" DROP CONSTRAINT "UQ_wa_template_statuses_tenant_catalog_entry"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_statuses" ADD "catalog_key" character varying(100)`);
        await queryRunner.query(`
            UPDATE "whatsapp_template_statuses" AS s
            SET "catalog_key" = c."key"
            FROM "whatsapp_template_catalog_entries" AS c
            WHERE c."id" = s."catalog_entry_id"
        `);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_statuses" ALTER COLUMN "catalog_key" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_statuses" ADD CONSTRAINT "UQ_wa_template_statuses_tenant_catalog" UNIQUE ("tenant_id", "catalog_key")`);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_statuses" DROP COLUMN "catalog_entry_id"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "es_platform_admin"`);
        await queryRunner.query(`DROP INDEX "UQ_wa_template_catalog_system_meta_name"`);
        await queryRunner.query(`DROP INDEX "UQ_wa_template_catalog_system_key"`);
        await queryRunner.query(`DROP TABLE "whatsapp_template_catalog_entries"`);
        await queryRunner.query(`DROP TYPE "whatsapp_template_category"`);
    }

}
