import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWhatsappSettings1794891049013 implements MigrationInterface {
    name = 'CreateWhatsappSettings1794891049013'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "whatsapp_settings" ("tenant_id" bigint NOT NULL, "respuestas_ia_habilitadas" boolean NOT NULL DEFAULT true, "url_automatizacion" text, "url_editor_n8n" text, "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_0d3d523f8b7228518caec92fddc" PRIMARY KEY ("tenant_id"))`);
        await queryRunner.query(`ALTER TABLE "whatsapp_settings" ADD CONSTRAINT "FK_whatsapp_settings_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "whatsapp_settings" DROP CONSTRAINT "FK_whatsapp_settings_tenant"`);
        await queryRunner.query(`DROP TABLE "whatsapp_settings"`);
    }

}
