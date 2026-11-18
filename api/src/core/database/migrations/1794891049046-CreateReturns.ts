import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateReturns1794891049046 implements MigrationInterface {
  name = "CreateReturns1794891049046";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "returns" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "local_id" bigint NOT NULL,
            "id_venta" bigint NOT NULL,
            "numero_devolucion" integer NOT NULL,
            "id_sesion_caja" bigint NOT NULL,
            "metodo_reembolso" character varying(20) NOT NULL,
            "motivo" text NOT NULL,
            "monto_reembolsado" numeric(10, 2) NOT NULL,
            "id_empleado_creador" bigint,
            "idempotency_key" character varying(100),
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_d349ffae997bbb0f42a29ecd3bb" UNIQUE ("public_id"),
            CONSTRAINT "UQ_98904d7c3178232e5367628eebe" UNIQUE ("tenant_id", "idempotency_key"),
            CONSTRAINT "UQ_0c5915dcbce4f293ce0b917bfe5" UNIQUE ("tenant_id", "numero_devolucion"),
            CONSTRAINT "PK_27a2f1895a71519ebfec7850361" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_returns_local" ON "returns" ("local_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "returns"
          ADD CONSTRAINT "FK_returns_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "returns"
          ADD CONSTRAINT "FK_returns_local" FOREIGN KEY ("local_id") REFERENCES "branches" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "returns"
          ADD CONSTRAINT "FK_1d6aaa8ce9253f8012187246b26" FOREIGN KEY ("id_venta") REFERENCES "sales" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "returns"
          DROP CONSTRAINT "FK_1d6aaa8ce9253f8012187246b26"
        `);
    await queryRunner.query(`
          ALTER TABLE "returns"
          DROP CONSTRAINT "FK_returns_local"
        `);
    await queryRunner.query(`
          ALTER TABLE "returns"
          DROP CONSTRAINT "FK_returns_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_returns_local"
        `);
    await queryRunner.query(`
          DROP TABLE "returns"
        `);
  }
}
