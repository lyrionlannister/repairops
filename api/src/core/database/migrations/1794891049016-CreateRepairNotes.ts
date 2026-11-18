import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRepairNotes1794891049016 implements MigrationInterface {
    name = 'CreateRepairNotes1794891049016'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "repair_notes" ("id" BIGSERIAL NOT NULL, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" bigint NOT NULL, "local_id" bigint NOT NULL, "customer_id" bigint, "numero_control" integer NOT NULL, "public_ref" character varying(8) NOT NULL, "nombre_cliente" character varying(255) NOT NULL, "numero_contacto" character varying(50), "marca" character varying(255) NOT NULL, "modelo" character varying(255) NOT NULL, "falla_reportada" text NOT NULL, "valor_total" numeric(10,2) NOT NULL DEFAULT '0', "estado" character varying(50) NOT NULL DEFAULT 'received', "requiere_anticipo" boolean NOT NULL DEFAULT false, "valor_anticipo" numeric(10,2), "fecha_recepcion" date NOT NULL, "hora_recepcion" character varying(5) NOT NULL, "fecha_entrega" date, "notas_tecnico" text, "hallazgos_adicionales" text, "id_empleado_asignado" bigint, "dispositivo_apagado" boolean NOT NULL DEFAULT false, "tiene_garantia" boolean NOT NULL DEFAULT false, "tiene_garantia_extendida" boolean NOT NULL DEFAULT false, "dias_garantia_extendida" integer, "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP DEFAULT now(), CONSTRAINT "UQ_1bfcad2193cc1427288dc094e5f" UNIQUE ("public_id"), CONSTRAINT "UQ_320624bde02c9be696a3dd40900" UNIQUE ("tenant_id", "numero_control"), CONSTRAINT "PK_514e9616895615bb53d09d9837c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_repair_notes_local" ON "repair_notes" ("local_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_repair_notes_public_ref" ON "repair_notes" ("public_ref") `);
        await queryRunner.query(`CREATE INDEX "IDX_repair_notes_tenant_status" ON "repair_notes" ("tenant_id", "estado") `);
        await queryRunner.query(`CREATE INDEX "IDX_repair_notes_tenant_received" ON "repair_notes" ("tenant_id", "fecha_recepcion") `);
        await queryRunner.query(`ALTER TABLE "repair_notes" ADD CONSTRAINT "FK_repair_notes_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "repair_notes" ADD CONSTRAINT "FK_repair_notes_local" FOREIGN KEY ("local_id") REFERENCES "branches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repair_notes" DROP CONSTRAINT "FK_repair_notes_local"`);
        await queryRunner.query(`ALTER TABLE "repair_notes" DROP CONSTRAINT "FK_repair_notes_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_repair_notes_tenant_received"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_repair_notes_tenant_status"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_repair_notes_public_ref"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_repair_notes_local"`);
        await queryRunner.query(`DROP TABLE "repair_notes"`);
    }

}
