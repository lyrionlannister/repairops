import { MigrationInterface, QueryRunner } from "typeorm";

// Folio consecutivo por tenant para cotizaciones, cortes de caja y conteos. Las filas
// existentes se numeran en orden cronologico y el contador de cada tenant arranca
// despues del ultimo folio asignado.
const FOLIOS = [
  {
    table: "quotes",
    column: "numero_cotizacion",
    counter: "siguiente_numero_cotizacion",
    orderBy: "fecha_creacion",
    where: "",
  },
  {
    table: "cash_sessions",
    column: "numero_corte",
    counter: "siguiente_numero_corte",
    orderBy: "fecha_cierre",
    where: "WHERE estado = 'closed'",
  },
  {
    table: "inventory_counts",
    column: "numero_conteo",
    counter: "siguiente_numero_conteo",
    orderBy: "fecha_apertura",
    where: "",
  },
];

export class DocumentFolios1795394863518 implements MigrationInterface {
  name = "DocumentFolios1795394863518";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "local_config"
      ADD "siguiente_numero_cotizacion" integer NOT NULL DEFAULT '1'
    `);
    await queryRunner.query(`
      ALTER TABLE "local_config"
      ADD "siguiente_numero_corte" integer NOT NULL DEFAULT '1'
    `);
    await queryRunner.query(`
      ALTER TABLE "local_config"
      ADD "siguiente_numero_conteo" integer NOT NULL DEFAULT '1'
    `);
    await queryRunner.query(`
      ALTER TABLE "quotes"
      ADD "numero_cotizacion" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "cash_sessions"
      ADD "numero_corte" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "inventory_counts"
      ADD "numero_conteo" integer
    `);

    for (const folio of FOLIOS) {
      await queryRunner.query(
        `UPDATE "${folio.table}" t SET "${folio.column}" = n.folio
         FROM (
           SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY "${folio.orderBy}", id) AS folio
           FROM "${folio.table}" ${folio.where}
         ) n
         WHERE t.id = n.id`,
      );
      await queryRunner.query(
        `INSERT INTO "local_config" ("tenant_id", "${folio.counter}")
         SELECT tenant_id, MAX("${folio.column}") + 1 FROM "${folio.table}"
         WHERE "${folio.column}" IS NOT NULL GROUP BY tenant_id
         ON CONFLICT ("tenant_id") DO UPDATE
         SET "${folio.counter}" = GREATEST("local_config"."${folio.counter}", EXCLUDED."${folio.counter}")`,
      );
    }

    await queryRunner.query(`
      ALTER TABLE "quotes"
      ALTER COLUMN "numero_cotizacion"
      SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "inventory_counts"
      ALTER COLUMN "numero_conteo"
      SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "quotes"
      ADD CONSTRAINT "UQ_quotes_tenant_numero" UNIQUE ("tenant_id", "numero_cotizacion")
    `);
    await queryRunner.query(`
      ALTER TABLE "cash_sessions"
      ADD CONSTRAINT "UQ_cash_sessions_tenant_numero_corte" UNIQUE ("tenant_id", "numero_corte")
    `);
    await queryRunner.query(`
      ALTER TABLE "inventory_counts"
      ADD CONSTRAINT "UQ_inventory_counts_tenant_numero" UNIQUE ("tenant_id", "numero_conteo")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "inventory_counts"
      DROP CONSTRAINT "UQ_inventory_counts_tenant_numero"
    `);
    await queryRunner.query(`
      ALTER TABLE "cash_sessions"
      DROP CONSTRAINT "UQ_cash_sessions_tenant_numero_corte"
    `);
    await queryRunner.query(`
      ALTER TABLE "quotes"
      DROP CONSTRAINT "UQ_quotes_tenant_numero"
    `);
    await queryRunner.query(`
      ALTER TABLE "inventory_counts"
      DROP COLUMN "numero_conteo"
    `);
    await queryRunner.query(`
      ALTER TABLE "cash_sessions"
      DROP COLUMN "numero_corte"
    `);
    await queryRunner.query(`
      ALTER TABLE "quotes"
      DROP COLUMN "numero_cotizacion"
    `);
    await queryRunner.query(`
      ALTER TABLE "local_config"
      DROP COLUMN "siguiente_numero_conteo"
    `);
    await queryRunner.query(`
      ALTER TABLE "local_config"
      DROP COLUMN "siguiente_numero_corte"
    `);
    await queryRunner.query(`
      ALTER TABLE "local_config"
      DROP COLUMN "siguiente_numero_cotizacion"
    `);
  }
}
