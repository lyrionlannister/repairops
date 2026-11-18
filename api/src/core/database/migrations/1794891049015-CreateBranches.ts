import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBranches1794891049015 implements MigrationInterface {
  name = "CreateBranches1794891049015";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "branches" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "nombre" character varying(255) NOT NULL,
            "direccion" character varying(500),
            "telefono" character varying(50),
            "activa" boolean NOT NULL DEFAULT true,
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            "fecha_actualizacion" TIMESTAMP DEFAULT now(),
            CONSTRAINT "UQ_43b11ad4d426321a2dd50599823" UNIQUE ("public_id"),
            CONSTRAINT "PK_7f37d3b42defea97f1df0d19535" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_branches_tenant" ON "branches" ("tenant_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "branches"
          ADD CONSTRAINT "FK_branches_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "branches"
          DROP CONSTRAINT "FK_branches_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_branches_tenant"
        `);
    await queryRunner.query(`
          DROP TABLE "branches"
        `);
  }
}
