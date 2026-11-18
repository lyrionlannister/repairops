import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateExcludedPhone1794891049012 implements MigrationInterface {
  name = "CreateExcludedPhone1794891049012";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "excluded_phone" (
            "tenant_id" bigint NOT NULL,
            "telefono" character varying(64) NOT NULL,
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            "fecha_actualizacion" TIMESTAMP DEFAULT now(),
            CONSTRAINT "PK_40b1d32147626c6c61577ac358a" PRIMARY KEY ("tenant_id", "telefono")
          )
        `);
    await queryRunner.query(`
          ALTER TABLE "excluded_phone"
          ADD CONSTRAINT "FK_excluded_phone_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "excluded_phone"
          DROP CONSTRAINT "FK_excluded_phone_tenant"
        `);
    await queryRunner.query(`
          DROP TABLE "excluded_phone"
        `);
  }
}
