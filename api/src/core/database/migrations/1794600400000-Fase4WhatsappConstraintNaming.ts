import { MigrationInterface, QueryRunner } from "typeorm";

// `schema:check` nunca pudo correr en este repo hasta ahora -- el CLI de
// TypeORM (`typeorm-ts-node-esm`) está roto desde la subida a Node 26/
// TypeScript 7 (ver `api/package.json`, cambiado a `tsx` en este mismo
// checkpoint). Con el gate funcionando por primera vez, aparece un drift real:
// las migraciones de `messaging/whatsapp-official/` (esta y una anterior,
// `Fase4WhatsappOutboundMessage`) nombraron sus constraints a mano con
// nombres legibles, en vez de dejar que `migration:generate` las nombrara
// con el hash que TypeORM usa por defecto (así es como ya estaban todas las
// demás tablas del proyecto, ej. `UQ_320624bde02c9be696a3dd40900` en
// `repair_notes`). Esta migración solo renombra -- ningún dato ni índice se
// recrea.
export class Fase4WhatsappConstraintNaming1794600400000 implements MigrationInterface {
    name = 'Fase4WhatsappConstraintNaming1794600400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "whatsapp_outbound_messages" RENAME CONSTRAINT "UQ_wa_outbound_messages_tenant_idempotency" TO "UQ_54a92479d302209b9654672611d"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_catalog_entries" RENAME CONSTRAINT "UQ_wa_template_catalog_tenant_key" TO "UQ_62b2c24361eb5dd038a4afadd61"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_catalog_entries" RENAME CONSTRAINT "UQ_wa_template_catalog_tenant_meta_name" TO "UQ_6276c258ac43948dfcc1f332d26"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_statuses" RENAME CONSTRAINT "UQ_wa_template_statuses_tenant_catalog_entry" TO "UQ_af3dbea3113bd76853e44730535"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_statuses" RENAME CONSTRAINT "FK_wa_template_statuses_catalog_entry" TO "FK_ce4eea887d526765fb9f02567b5"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "whatsapp_template_statuses" RENAME CONSTRAINT "FK_ce4eea887d526765fb9f02567b5" TO "FK_wa_template_statuses_catalog_entry"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_statuses" RENAME CONSTRAINT "UQ_af3dbea3113bd76853e44730535" TO "UQ_wa_template_statuses_tenant_catalog_entry"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_catalog_entries" RENAME CONSTRAINT "UQ_6276c258ac43948dfcc1f332d26" TO "UQ_wa_template_catalog_tenant_meta_name"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_catalog_entries" RENAME CONSTRAINT "UQ_62b2c24361eb5dd038a4afadd61" TO "UQ_wa_template_catalog_tenant_key"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_outbound_messages" RENAME CONSTRAINT "UQ_54a92479d302209b9654672611d" TO "UQ_wa_outbound_messages_tenant_idempotency"`);
    }

}
