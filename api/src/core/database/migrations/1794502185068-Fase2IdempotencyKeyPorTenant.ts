import { MigrationInterface, QueryRunner } from "typeorm";

export class Fase2IdempotencyKeyPorTenant1794502185068 implements MigrationInterface {
    name = 'Fase2IdempotencyKeyPorTenant1794502185068'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "UQ_7e4b24f1763de13f8f03ba89fd8"`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "UQ_7fe776f75472f53a7aad117ccf5" UNIQUE ("tenant_id", "idempotency_key")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "UQ_7fe776f75472f53a7aad117ccf5"`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "UQ_7e4b24f1763de13f8f03ba89fd8" UNIQUE ("idempotency_key")`);
    }

}
