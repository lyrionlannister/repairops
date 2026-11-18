import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLayaways1794891049052 implements MigrationInterface {
  name = "CreateLayaways1794891049052";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "layaways" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "local_id" bigint NOT NULL,
            "id_cliente" bigint NOT NULL,
            "estado" character varying(10) NOT NULL DEFAULT 'open',
            "valor_total" numeric(10, 2) NOT NULL,
            "monto_anticipo" numeric(10, 2) NOT NULL,
            "metodo_anticipo" character varying(20) NOT NULL,
            "fecha_vencimiento" date NOT NULL,
            "id_empleado_creador" bigint,
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            "fecha_completado" TIMESTAMP,
            "fecha_cancelado" TIMESTAMP,
            "fecha_vencido" TIMESTAMP,
            CONSTRAINT "UQ_9f074cefa866dd31b2889cdfad3" UNIQUE ("public_id"),
            CONSTRAINT "PK_267e667e4f10178d47a515f8ae5" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_layaways_tenant" ON "layaways" ("tenant_id")
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_layaways_local" ON "layaways" ("local_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "layaways"
          ADD CONSTRAINT "FK_layaways_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "layaways"
          ADD CONSTRAINT "FK_layaways_local" FOREIGN KEY ("local_id") REFERENCES "branches" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "layaways"
          ADD CONSTRAINT "FK_835f50e4df71c02e6068905f416" FOREIGN KEY ("id_cliente") REFERENCES "customers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "layaways"
          DROP CONSTRAINT "FK_835f50e4df71c02e6068905f416"
        `);
    await queryRunner.query(`
          ALTER TABLE "layaways"
          DROP CONSTRAINT "FK_layaways_local"
        `);
    await queryRunner.query(`
          ALTER TABLE "layaways"
          DROP CONSTRAINT "FK_layaways_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_layaways_local"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_layaways_tenant"
        `);
    await queryRunner.query(`
          DROP TABLE "layaways"
        `);
  }
}
