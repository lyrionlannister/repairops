import { MigrationInterface, QueryRunner } from "typeorm";

export class CustomerPhoneOptional1795600000001 implements MigrationInterface {
  name = "CustomerPhoneOptional1795600000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "telefono" DROP NOT NULL`);
  }

  // Los clientes que quedaron sin telefono no pueden volver a NOT NULL: se rellenan con '' antes.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "customers" SET "telefono" = '' WHERE "telefono" IS NULL`);
    await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "telefono" SET NOT NULL`);
  }
}
