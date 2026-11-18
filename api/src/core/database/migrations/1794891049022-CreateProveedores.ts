import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProveedores1794891049022 implements MigrationInterface {
    name = 'CreateProveedores1794891049022'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "proveedores" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "nombre" character varying(255) NOT NULL, "telefono" character varying(20) NOT NULL, "email" character varying(255), "direccion" character varying(500), "nombre_contacto" character varying(255), "activo" boolean NOT NULL DEFAULT true, "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP DEFAULT now(), CONSTRAINT "UQ_2d663672de902aea1c2fceddd25" UNIQUE ("public_id"), CONSTRAINT "PK_1dcf121f19f362fb1b4c0a493a9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_proveedores_tenant" ON "proveedores" ("tenant_id") `);
        await queryRunner.query(`ALTER TABLE "proveedores" ADD CONSTRAINT "FK_proveedores_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "proveedores" DROP CONSTRAINT "FK_proveedores_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_proveedores_tenant"`);
        await queryRunner.query(`DROP TABLE "proveedores"`);
    }

}
