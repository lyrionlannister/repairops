import { MigrationInterface, QueryRunner } from "typeorm";

// Drift de esquema arrastrado desde audit_logs/refresh_tokens/tenant_invitations
// (y ahora email_verification_tokens): el decorator @CreateDateColumn con
// `default: () => "CURRENT_TIMESTAMP"` se compara contra el default real
// de Postgres, que normaliza el literal a `now()` -- pnpm schema:check
// marcaba las 4 tablas como desincronizadas sin que nadie tocara su DDL.
// También recrea el índice de audit_logs con el orden de columnas que
// TypeORM espera (tenant_id, fecha_creacion).
export class NormalizeFechaCreacionDefaults1795600000021 implements MigrationInterface {
  name = "NormalizeFechaCreacionDefaults1795600000021";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_audit_logs_tenant_created"
    `);
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ALTER COLUMN "fecha_creacion"
      SET DEFAULT now()
    `);
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      ALTER COLUMN "fecha_creacion"
      SET DEFAULT now()
    `);
    await queryRunner.query(`
      ALTER TABLE "tenant_invitations"
      ALTER COLUMN "fecha_creacion"
      SET DEFAULT now()
    `);
    await queryRunner.query(`
      ALTER TABLE "email_verification_tokens"
      ALTER COLUMN "fecha_creacion"
      SET DEFAULT now()
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_tenant_created" ON "audit_logs" ("tenant_id", "fecha_creacion")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_audit_logs_tenant_created"
    `);
    await queryRunner.query(`
      ALTER TABLE "email_verification_tokens"
      ALTER COLUMN "fecha_creacion"
      SET DEFAULT CURRENT_TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "tenant_invitations"
      ALTER COLUMN "fecha_creacion"
      SET DEFAULT CURRENT_TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      ALTER COLUMN "fecha_creacion"
      SET DEFAULT CURRENT_TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ALTER COLUMN "fecha_creacion"
      SET DEFAULT CURRENT_TIMESTAMP
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_tenant_created" ON "audit_logs" USING btree ("fecha_creacion", "tenant_id")
    `);
  }
}
