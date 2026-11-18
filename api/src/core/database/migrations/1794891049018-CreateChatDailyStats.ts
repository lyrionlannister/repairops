import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChatDailyStats1794891049018 implements MigrationInterface {
    name = 'CreateChatDailyStats1794891049018'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chat_daily_stats" ("tenant_id" bigint NOT NULL, "day" date NOT NULL, "messages" integer NOT NULL DEFAULT '0', "last_message_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_9677eaa85870885adc16a92bd18" PRIMARY KEY ("tenant_id", "day"))`);
        await queryRunner.query(`ALTER TABLE "chat_daily_stats" ADD CONSTRAINT "FK_chat_daily_stats_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_daily_stats" DROP CONSTRAINT "FK_chat_daily_stats_tenant"`);
        await queryRunner.query(`DROP TABLE "chat_daily_stats"`);
    }

}
