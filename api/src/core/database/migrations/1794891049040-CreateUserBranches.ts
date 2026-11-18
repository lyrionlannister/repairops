import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserBranches1794891049040 implements MigrationInterface {
    name = 'CreateUserBranches1794891049040'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_branches" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "user_id" bigint NOT NULL, "branch_id" bigint NOT NULL, "is_primary" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_198135faa9af93c50aba9890144" UNIQUE ("public_id"), CONSTRAINT "PK_45063e37edfcad5acaa0158c53a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_user_branches_one_primary" ON "user_branches" ("user_id") WHERE "is_primary" = true`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_user_branches_user_branch" ON "user_branches" ("user_id", "branch_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_user_branches_user" ON "user_branches" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_user_branches_tenant" ON "user_branches" ("tenant_id") `);
        await queryRunner.query(`ALTER TABLE "user_branches" ADD CONSTRAINT "FK_user_branches_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_branches" ADD CONSTRAINT "FK_user_branches_user" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_branches" ADD CONSTRAINT "FK_user_branches_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_branches" DROP CONSTRAINT "FK_user_branches_branch"`);
        await queryRunner.query(`ALTER TABLE "user_branches" DROP CONSTRAINT "FK_user_branches_user"`);
        await queryRunner.query(`ALTER TABLE "user_branches" DROP CONSTRAINT "FK_user_branches_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_branches_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_branches_user"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_user_branches_user_branch"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_user_branches_one_primary"`);
        await queryRunner.query(`DROP TABLE "user_branches"`);
    }

}
