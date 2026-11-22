import { MigrationInterface, QueryRunner } from "typeorm";

// Va después de CreateUserRoles: reutiliza el enum "user_role" que crea esa migración.
export class CreateBranchDiscountCaps1794891049058 implements MigrationInterface {
  name = "CreateBranchDiscountCaps1794891049058";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "branch_discount_caps" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "branch_id" bigint NOT NULL,
            "role" "public"."user_role" NOT NULL,
            "max_discount_percent" numeric(5, 2) NOT NULL,
            CONSTRAINT "UQ_af3a9dbb24efc276900d7667238" UNIQUE ("public_id"),
            CONSTRAINT "CHK_branch_discount_caps_range" CHECK ("max_discount_percent" >= 0 AND "max_discount_percent" <= 100),
            CONSTRAINT "PK_cf49fa4aaf9af0cca21e99de538" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          CREATE UNIQUE INDEX "UQ_branch_discount_caps_branch_role" ON "branch_discount_caps" ("branch_id", "role")
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_branch_discount_caps_tenant" ON "branch_discount_caps" ("tenant_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "branch_discount_caps"
          ADD CONSTRAINT "FK_branch_discount_caps_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "branch_discount_caps"
          ADD CONSTRAINT "FK_branch_discount_caps_branch" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "branch_discount_caps"
          DROP CONSTRAINT "FK_branch_discount_caps_branch"
        `);
    await queryRunner.query(`
          ALTER TABLE "branch_discount_caps"
          DROP CONSTRAINT "FK_branch_discount_caps_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_branch_discount_caps_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."UQ_branch_discount_caps_branch_role"
        `);
    await queryRunner.query(`
          DROP TABLE "branch_discount_caps"
        `);
  }
}
