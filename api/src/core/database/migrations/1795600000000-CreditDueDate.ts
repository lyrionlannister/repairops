import { MigrationInterface, QueryRunner } from "typeorm";

// Los creditos ya registrados quedan sin fecha limite (NULL): no hay de donde
// inferirla. El CHECK solo impide fecha en pagos que no son credito.
export class CreditDueDate1795600000000 implements MigrationInterface {
  name = "CreditDueDate1795600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sale_payments" ADD "fecha_vencimiento" date`);
    await queryRunner.query(`
      ALTER TABLE "sale_payments"
      ADD CONSTRAINT "CHK_sale_payments_fecha_vencimiento" CHECK ("metodo" = 'credito' OR "fecha_vencimiento" IS NULL)
    `);
    await queryRunner.query(`ALTER TABLE "repair_note_payments" ADD "fecha_vencimiento" date`);
    await queryRunner.query(`
      ALTER TABLE "repair_note_payments"
      ADD CONSTRAINT "CHK_repair_note_payments_fecha_vencimiento" CHECK ("metodo" = 'credito' OR "fecha_vencimiento" IS NULL)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "repair_note_payments" DROP CONSTRAINT "CHK_repair_note_payments_fecha_vencimiento"`);
    await queryRunner.query(`ALTER TABLE "repair_note_payments" DROP COLUMN "fecha_vencimiento"`);
    await queryRunner.query(`ALTER TABLE "sale_payments" DROP CONSTRAINT "CHK_sale_payments_fecha_vencimiento"`);
    await queryRunner.query(`ALTER TABLE "sale_payments" DROP COLUMN "fecha_vencimiento"`);
  }
}
