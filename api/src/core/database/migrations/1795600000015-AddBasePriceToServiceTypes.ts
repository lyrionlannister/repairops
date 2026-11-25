import { MigrationInterface, QueryRunner } from "typeorm";

// Precio base configurable por tipo de servicio: cuando está configurado, el
// servidor exige que la venta cobre exactamente ese precio (nunca el que
// manda el cliente); cuando es null, el precio lo fija un humano y queda en
// bitácora (ver SaleService/QuoteService).
export class AddBasePriceToServiceTypes1795600000015 implements MigrationInterface {
  name = "AddBasePriceToServiceTypes1795600000015";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "service_types"
          ADD COLUMN "precio_base" numeric(10,2)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "service_types"
          DROP COLUMN "precio_base"
        `);
  }
}
