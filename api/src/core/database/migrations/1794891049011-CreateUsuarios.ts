import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsuarios1794891049011 implements MigrationInterface {
    name = 'CreateUsuarios1794891049011'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "usuarios" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "rol" character varying(20) NOT NULL DEFAULT 'owner', "salario" numeric(10,2), "ciclo_pago" character varying(20), "nombre" character varying(100) NOT NULL, "apellido" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "contrasena" character varying(255) NOT NULL, "activo" boolean NOT NULL DEFAULT true, "es_platform_admin" boolean NOT NULL DEFAULT false, "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP DEFAULT now(), CONSTRAINT "UQ_658550f0993ec0bc0fd724872d7" UNIQUE ("public_id"), CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_usuarios_tenant" ON "usuarios" ("tenant_id") `);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD CONSTRAINT "FK_usuarios_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" DROP CONSTRAINT "FK_usuarios_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_usuarios_tenant"`);
        await queryRunner.query(`DROP TABLE "usuarios"`);
    }

}
