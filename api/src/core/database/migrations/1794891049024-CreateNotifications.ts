import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotifications1794891049024 implements MigrationInterface {
  name = "CreateNotifications1794891049024";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "notifications" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "tipo" character varying(50) NOT NULL,
            "session_id" character varying(100) NOT NULL,
            "telefono" character varying(100) NOT NULL,
            "nombre_contacto" character varying(255),
            "leida" boolean NOT NULL DEFAULT false,
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_ffd14df0a11028f62d799bb8ff0" UNIQUE ("public_id"),
            CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_notifications_tenant" ON "notifications" ("tenant_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "notifications"
          ADD CONSTRAINT "FK_notifications_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "notifications"
          DROP CONSTRAINT "FK_notifications_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_notifications_tenant"
        `);
    await queryRunner.query(`
          DROP TABLE "notifications"
        `);
  }
}
