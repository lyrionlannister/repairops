import { MigrationInterface, QueryRunner } from "typeorm";

// CashService.openSession revisa "no hay otra abierta" y luego inserta: dos
// aperturas simultaneas (doble clic, dos cajeros) pasaban ambas el chequeo y
// dejaban dos sesiones abiertas en la misma sucursal, partiendo los cobros.
// El indice parcial lo hace imposible a nivel base de datos.
export class AddOneOpenCashSessionPerBranch1795600000024 implements MigrationInterface {
  name = "AddOneOpenCashSessionPerBranch1795600000024";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_cash_sessions_one_open_per_local"
      ON "cash_sessions" ("tenant_id", "local_id")
      WHERE estado = 'open'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."UQ_cash_sessions_one_open_per_local"
    `);
  }
}
