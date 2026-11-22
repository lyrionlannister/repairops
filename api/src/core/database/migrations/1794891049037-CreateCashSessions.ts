import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCashSessions1794891049037 implements MigrationInterface {
  name = "CreateCashSessions1794891049037";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "cash_sessions" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "local_id" bigint NOT NULL,
            "id_empleado_apertura" bigint,
            "saldo_apertura" numeric(10, 2) NOT NULL,
            "saldo_cierre" numeric(10, 2),
            "estado" character varying(10) NOT NULL DEFAULT 'open',
            "diferencia" numeric(10, 2),
            "motivo_diferencia" text,
            "id_empleado_autoriza_diferencia" bigint,
            "fecha_apertura" TIMESTAMP NOT NULL DEFAULT now(),
            "fecha_cierre" TIMESTAMP,
            "id_empleado_cierre" bigint,
            CONSTRAINT "UQ_d061925fe46389bd928428b8182" UNIQUE ("public_id"),
            CONSTRAINT "PK_946ea5ce864b10fb70162708448" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_cash_sessions_local" ON "cash_sessions" ("local_id")
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_cash_sessions_tenant" ON "cash_sessions" ("tenant_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "cash_sessions"
          ADD CONSTRAINT "FK_cash_sessions_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "cash_sessions"
          ADD CONSTRAINT "FK_cash_sessions_local" FOREIGN KEY ("local_id") REFERENCES "branches" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "cash_sessions"
          DROP CONSTRAINT "FK_cash_sessions_local"
        `);
    await queryRunner.query(`
          ALTER TABLE "cash_sessions"
          DROP CONSTRAINT "FK_cash_sessions_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_cash_sessions_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_cash_sessions_local"
        `);
    await queryRunner.query(`
          DROP TABLE "cash_sessions"
        `);
  }
}
