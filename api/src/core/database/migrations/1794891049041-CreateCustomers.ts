import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCustomers1794891049041 implements MigrationInterface {
    name = 'CreateCustomers1794891049041'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "customers" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "nombre" character varying(255) NOT NULL, "telefono" character varying(50) NOT NULL, "email" character varying(255), "limite_credito" numeric(10,2) NOT NULL DEFAULT '0', "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP DEFAULT now(), CONSTRAINT "UQ_6c08212d10bb9c266861b04bfa6" UNIQUE ("public_id"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_customers_tenant" ON "customers" ("tenant_id") `);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_customers_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_customers_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_customers_tenant"`);
        await queryRunner.query(`DROP TABLE "customers"`);
    }

}
