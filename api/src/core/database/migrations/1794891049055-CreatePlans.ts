import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePlans1794891049055 implements MigrationInterface {
  name = "CreatePlans1794891049055";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "plans" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "key" character varying(30) NOT NULL,
            "nombre" character varying(60) NOT NULL,
            "max_users" integer,
            "max_branches" integer,
            "publico" boolean NOT NULL DEFAULT true,
            CONSTRAINT "UQ_f57e3c2ebdfa396f61556a03d06" UNIQUE ("public_id"),
            CONSTRAINT "UQ_81fbbbb81d6b241363f82c17b09" UNIQUE ("key"),
            CONSTRAINT "CHK_plans_limits" CHECK (("max_users" IS NULL OR "max_users" > 0) AND ("max_branches" IS NULL OR "max_branches" > 0)),
            CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id")
          )
        `);
    // Datos de referencia que el código necesita para funcionar (registro y bootstrap
    // buscan estos keys), no datos de prueba.
    await queryRunner.query(`
          INSERT INTO "plans" ("key", "nombre", "max_users", "max_branches", "publico") VALUES
            ('basico', 'Básico', 3, 1, true),
            ('crecimiento', 'Crecimiento', 8, 3, true),
            ('cadena', 'Cadena', 15, 5, true),
            ('platform', 'Plataforma', NULL, NULL, false)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          DROP TABLE "plans"
        `);
  }
}
