import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChatDailyContacts1794891049019 implements MigrationInterface {
    name = 'CreateChatDailyContacts1794891049019'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chat_daily_contacts" ("tenant_id" bigint NOT NULL, "day" date NOT NULL, "contact_phone" character varying(32) NOT NULL, CONSTRAINT "PK_b544cde51d3766ee40dadf70c12" PRIMARY KEY ("tenant_id", "day", "contact_phone"))`);
        await queryRunner.query(`ALTER TABLE "chat_daily_contacts" ADD CONSTRAINT "FK_chat_daily_contacts_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_daily_contacts" DROP CONSTRAINT "FK_chat_daily_contacts_tenant"`);
        await queryRunner.query(`DROP TABLE "chat_daily_contacts"`);
    }

}
