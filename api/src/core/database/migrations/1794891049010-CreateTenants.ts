import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTenants1794891049010 implements MigrationInterface {
  name = "CreateTenants1794891049010";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tenants"
      (
        "id" BIGSERIAL NOT NULL,
        "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nombre" character varying(255) NOT NULL,
        "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
        "fecha_actualizacion" TIMESTAMP DEFAULT now(),
        CONSTRAINT "UQ_d15f86ccbaf13eedaf6489a8a6d" UNIQUE ("public_id"),
        CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id")
    )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tenants"`);
  }
}
