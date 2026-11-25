import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantForeignKeysToRefreshTokensAndAuditLogs1795600000025
  implements MigrationInterface
{
  name = "AddTenantForeignKeysToRefreshTokensAndAuditLogs1795600000025";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "refresh_tokens" r
      WHERE NOT EXISTS (SELECT 1 FROM "tenants" t WHERE t."id" = r."tenant_id")
    `);
    await queryRunner.query(`
      UPDATE "audit_logs" a SET "tenant_id" = NULL
      WHERE a."tenant_id" IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM "tenants" t WHERE t."id" = a."tenant_id")
    `);
    await queryRunner.query(`DROP INDEX "public"."IDX_refresh_tokens_user"`);
    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_tenant" ON "refresh_tokens" ("tenant_id", "user_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      ADD CONSTRAINT "FK_refresh_tokens_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD CONSTRAINT "FK_audit_logs_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_tenant"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_refresh_tokens_tenant"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_refresh_tokens_tenant"`);
    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_user" ON "refresh_tokens" ("user_id", "tenant_id")
    `);
  }
}
