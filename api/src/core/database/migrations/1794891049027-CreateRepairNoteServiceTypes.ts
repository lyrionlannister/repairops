import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRepairNoteServiceTypes1794891049027 implements MigrationInterface {
    name = 'CreateRepairNoteServiceTypes1794891049027'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "repair_note_service_types" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "id_nota_reparacion" bigint NOT NULL, "id_tipo_servicio" bigint NOT NULL, CONSTRAINT "UQ_10e95339489901f5ee40bdfdf2e" UNIQUE ("public_id"), CONSTRAINT "PK_384453c422ab5e46820e1a1ddf2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_repair_note_service_types_id_tipo_servicio" ON "repair_note_service_types" ("id_tipo_servicio") `);
        await queryRunner.query(`CREATE INDEX "IDX_repair_note_service_types_id_nota_reparacion" ON "repair_note_service_types" ("id_nota_reparacion") `);
        await queryRunner.query(`CREATE INDEX "IDX_repair_note_service_types_tenant" ON "repair_note_service_types" ("tenant_id") `);
        await queryRunner.query(`ALTER TABLE "repair_note_service_types" ADD CONSTRAINT "FK_repair_note_service_types_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "repair_note_service_types" ADD CONSTRAINT "FK_repair_note_service_types_id_nota_reparacion" FOREIGN KEY ("id_nota_reparacion") REFERENCES "repair_notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "repair_note_service_types" ADD CONSTRAINT "FK_repair_note_service_types_id_tipo_servicio" FOREIGN KEY ("id_tipo_servicio") REFERENCES "service_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repair_note_service_types" DROP CONSTRAINT "FK_repair_note_service_types_id_tipo_servicio"`);
        await queryRunner.query(`ALTER TABLE "repair_note_service_types" DROP CONSTRAINT "FK_repair_note_service_types_id_nota_reparacion"`);
        await queryRunner.query(`ALTER TABLE "repair_note_service_types" DROP CONSTRAINT "FK_repair_note_service_types_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_repair_note_service_types_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_repair_note_service_types_id_nota_reparacion"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_repair_note_service_types_id_tipo_servicio"`);
        await queryRunner.query(`DROP TABLE "repair_note_service_types"`);
    }

}
