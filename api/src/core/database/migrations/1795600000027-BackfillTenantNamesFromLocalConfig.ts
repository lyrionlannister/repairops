import { MigrationInterface, QueryRunner } from "typeorm";

// Hasta ahora el tenant se creaba con el correo del dueño como nombre. Si el
// taller ya capturó su nombre comercial en local_config, ese pasa a ser el
// nombre del tenant. Los que aún no lo capturan conservan el que tenían.
export class BackfillTenantNamesFromLocalConfig1795600000027 implements MigrationInterface {
  name = "BackfillTenantNamesFromLocalConfig1795600000027";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "tenants" t
      SET "nombre" = TRIM(lc."nombre")
      FROM "local_config" lc
      WHERE lc."tenant_id" = t."id"
        AND lc."nombre" IS NOT NULL
        AND TRIM(lc."nombre") <> ''
        AND t."nombre" LIKE '%@%'
    `);
  }

  public async down(): Promise<void> {
    // Sin reversa: el correo original no se guarda y el nombre comercial es válido.
  }
}
