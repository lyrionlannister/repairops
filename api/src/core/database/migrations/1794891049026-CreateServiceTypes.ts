import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateServiceTypes1794891049026 implements MigrationInterface {
  name = "CreateServiceTypes1794891049026";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "service_types" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "nombre" character varying(100) NOT NULL,
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_3c17ce3e5bac9db0555305b6ff3" UNIQUE ("public_id"),
            CONSTRAINT "PK_1dc93417a097cdee3491f39d7cc" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_service_types_tenant" ON "service_types" ("tenant_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "service_types"
          ADD CONSTRAINT "FK_service_types_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "service_types"
          DROP CONSTRAINT "FK_service_types_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_service_types_tenant"
        `);
    await queryRunner.query(`
          DROP TABLE "service_types"
        `);
  }
}
