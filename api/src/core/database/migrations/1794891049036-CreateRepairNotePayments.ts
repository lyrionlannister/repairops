import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRepairNotePayments1794891049036 implements MigrationInterface {
  name = "CreateRepairNotePayments1794891049036";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "repair_note_payments" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "id_nota_reparacion" bigint NOT NULL,
            "tipo" character varying(20) NOT NULL,
            "metodo" character varying(20) NOT NULL,
            "monto" numeric(10, 2) NOT NULL,
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_repair_note_payments_public_id" UNIQUE ("public_id"),
            CONSTRAINT "CHK_repair_note_payments_tipo" CHECK ("tipo" IN ('advance', 'delivery')),
            CONSTRAINT "CHK_repair_note_payments_metodo" CHECK (
              "metodo" IN ('efectivo', 'tarjeta', 'transferencia', 'credito')
            ),
            CONSTRAINT "CHK_repair_note_payments_monto" CHECK ("monto" > 0),
            CONSTRAINT "PK_repair_note_payments" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_repair_note_payments_id_nota_reparacion" ON "repair_note_payments" ("id_nota_reparacion")
        `);
    await queryRunner.query(`
          CREATE INDEX "IDX_repair_note_payments_tenant" ON "repair_note_payments" ("tenant_id")
        `);
    await queryRunner.query(`
          ALTER TABLE "repair_note_payments"
          ADD CONSTRAINT "FK_repair_note_payments_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
          ALTER TABLE "repair_note_payments"
          ADD CONSTRAINT "FK_repair_note_payments_id_nota_reparacion" FOREIGN KEY ("id_nota_reparacion") REFERENCES "repair_notes" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "repair_note_payments"
          DROP CONSTRAINT "FK_repair_note_payments_id_nota_reparacion"
        `);
    await queryRunner.query(`
          ALTER TABLE "repair_note_payments"
          DROP CONSTRAINT "FK_repair_note_payments_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_repair_note_payments_tenant"
        `);
    await queryRunner.query(`
          DROP INDEX "public"."IDX_repair_note_payments_id_nota_reparacion"
        `);
    await queryRunner.query(`
          DROP TABLE "repair_note_payments"
        `);
  }
}
