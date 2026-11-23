import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWhatsappQuotaToPlans1795600000006 implements MigrationInterface {
  name = "AddWhatsappQuotaToPlans1795600000006";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "plans" ADD "whatsapp_monthly_quota" integer
        `);
    await queryRunner.query(`
          ALTER TABLE "plans"
          ADD CONSTRAINT "CHK_plans_whatsapp_quota" CHECK ("whatsapp_monthly_quota" IS NULL OR "whatsapp_monthly_quota" > 0)
        `);
    await queryRunner.query(`
          UPDATE "plans" SET "whatsapp_monthly_quota" = 300 WHERE "key" = 'basico'
        `);
    await queryRunner.query(`
          UPDATE "plans" SET "whatsapp_monthly_quota" = 1000 WHERE "key" = 'crecimiento'
        `);
    await queryRunner.query(`
          UPDATE "plans" SET "whatsapp_monthly_quota" = 3000 WHERE "key" = 'cadena'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "plans" DROP CONSTRAINT "CHK_plans_whatsapp_quota"
        `);
    await queryRunner.query(`
          ALTER TABLE "plans" DROP COLUMN "whatsapp_monthly_quota"
        `);
  }
}
