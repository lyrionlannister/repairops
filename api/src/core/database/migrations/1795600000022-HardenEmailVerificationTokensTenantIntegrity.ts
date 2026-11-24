import { MigrationInterface, QueryRunner } from "typeorm";

// tests/core/database/tenant-integrity.test.ts exige, para toda tabla con
// tenant_id: una FK real en cascada hacia tenants y un índice que empiece
// por tenant_id. La migración 019 no lo tenía (mismo hueco que
// refresh_tokens, anterior a esta rama y fuera de alcance acá) -- esta
// migración lo corrige solo para email_verification_tokens, su tabla
// nueva en esta rama.
export class HardenEmailVerificationTokensTenantIntegrity1795600000022 implements MigrationInterface {
  name = "HardenEmailVerificationTokensTenantIntegrity1795600000022";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          DROP INDEX "public"."IDX_email_verification_tokens_user"
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_email_verification_tokens_tenant" ON "email_verification_tokens" ("tenant_id", "user_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "email_verification_tokens"
          ADD CONSTRAINT "FK_email_verification_tokens_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "email_verification_tokens" DROP CONSTRAINT "FK_email_verification_tokens_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_email_verification_tokens_tenant"
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_email_verification_tokens_user" ON "email_verification_tokens" ("user_id", "tenant_id")
        `);
  }
}
