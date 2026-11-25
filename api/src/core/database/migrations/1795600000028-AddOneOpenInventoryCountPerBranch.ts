import { MigrationInterface, QueryRunner } from "typeorm";

// Dos conteos abiertos en la misma sucursal aplicarían ajustes encontrados.
// Si ya existen, se conserva abierto el más reciente y los anteriores se
// cierran sin aplicar ajustes (nunca se cerraron, no movieron stock).
export class AddOneOpenInventoryCountPerBranch1795600000028 implements MigrationInterface {
  name = "AddOneOpenInventoryCountPerBranch1795600000028";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "inventory_counts" c
      SET "estado" = 'closed', "fecha_cierre" = now()
      WHERE c."estado" = 'open'
        AND EXISTS (
          SELECT 1 FROM "inventory_counts" newer
          WHERE newer."tenant_id" = c."tenant_id"
            AND newer."branch_id" = c."branch_id"
            AND newer."estado" = 'open'
            AND newer."id" > c."id"
        )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_inventory_counts_one_open_per_branch"
      ON "inventory_counts" ("tenant_id", "branch_id") WHERE estado = 'open'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."UQ_inventory_counts_one_open_per_branch"
    `);
  }
}
