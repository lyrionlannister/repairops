import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserRoles1794891049057 implements MigrationInterface {
  name = "CreateUserRoles1794891049057";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TYPE "public"."user_role" AS ENUM('owner', 'cashier', 'technician', 'employee')
        `);
    await queryRunner.query(`
          CREATE TABLE "user_roles" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "user_id" bigint NOT NULL,
            "role" "public"."user_role" NOT NULL,
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_823a76ead81f0ca7cac5b15591a" UNIQUE ("public_id"),
            CONSTRAINT "PK_8acd5cf26ebd158416f477de799" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          CREATE UNIQUE INDEX "UQ_user_roles_user_role" ON "user_roles" ("user_id", "role")
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_user_roles_tenant" ON "user_roles" ("tenant_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "user_roles"
          ADD CONSTRAINT "FK_user_roles_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "user_roles"
          ADD CONSTRAINT "FK_user_roles_user" FOREIGN KEY ("user_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "user_roles"
          DROP CONSTRAINT "FK_user_roles_user"
        `);
    await queryRunner.query(`
          ALTER TABLE "user_roles"
          DROP CONSTRAINT "FK_user_roles_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_user_roles_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."UQ_user_roles_user_role"
        `);
    await queryRunner.query(`
          DROP TABLE "user_roles"
        `);
    await queryRunner.query(`
          DROP TYPE "public"."user_role"
        `);
  }
}
