import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateContactNames1794891049014 implements MigrationInterface {
    name = 'CreateContactNames1794891049014'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "contact_names" ("tenant_id" bigint NOT NULL, "telefono" character varying(50) NOT NULL, "nombre" character varying(255) NOT NULL, "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_b6051a3d6864eefc0406e9a353f" PRIMARY KEY ("tenant_id", "telefono"))`);
        await queryRunner.query(`ALTER TABLE "contact_names" ADD CONSTRAINT "FK_contact_names_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contact_names" DROP CONSTRAINT "FK_contact_names_tenant"`);
        await queryRunner.query(`DROP TABLE "contact_names"`);
    }

}
