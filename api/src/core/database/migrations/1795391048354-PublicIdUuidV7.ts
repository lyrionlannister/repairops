import { MigrationInterface, QueryRunner } from "typeorm";

export class PublicIdUuidV71795391048354 implements MigrationInterface {
  name = "PublicIdUuidV71795391048354";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`);
    await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`);
    await queryRunner.query(`ALTER TABLE "branches" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "branches" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`);
    await queryRunner.query(`ALTER TABLE "repair_notes" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "repair_notes" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(`ALTER TABLE "chat_messages" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "chat_messages" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(`ALTER TABLE "local_config" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "local_config" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_templates" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_templates" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(`ALTER TABLE "proveedores" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "proveedores" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(`ALTER TABLE "price_list_items" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "price_list_items" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "repair_note_items" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "repair_note_items" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(`ALTER TABLE "service_types" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "service_types" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "repair_note_service_types" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "repair_note_service_types" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(`ALTER TABLE "inventory_items" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "inventory_items" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`);
    await queryRunner.query(`ALTER TABLE "sale_items" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "sale_items" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(`ALTER TABLE "sale_payments" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "sale_payments" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(`ALTER TABLE "quotes" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "quotes" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`);
    await queryRunner.query(`ALTER TABLE "quote_items" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "quote_items" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "quote_service_types" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "quote_service_types" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "repair_note_payments" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "repair_note_payments" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(`ALTER TABLE "cash_sessions" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "cash_sessions" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(`ALTER TABLE "cash_movements" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "cash_movements" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "revenue_attribution_settings" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "revenue_attribution_settings" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(`ALTER TABLE "user_branches" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "user_branches" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "customers" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_accounts" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_accounts" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_template_catalog_entries" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_template_catalog_entries" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_template_statuses" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_template_statuses" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_outbound_messages" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_outbound_messages" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(`ALTER TABLE "returns" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "returns" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`);
    await queryRunner.query(`ALTER TABLE "return_items" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "return_items" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_transfers" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_transfers" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(`ALTER TABLE "inventory_counts" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "inventory_counts" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_count_items" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_count_items" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_reservations" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_reservations" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(`ALTER TABLE "layaways" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "layaways" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`);
    await queryRunner.query(`ALTER TABLE "layaway_items" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "layaway_items" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_payments" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_payments" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`);
    await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(`ALTER TABLE "user_roles" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "user_roles" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "branch_discount_caps" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "branch_discount_caps" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "branch_discount_caps" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "branch_discount_caps" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "user_roles" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "user_roles" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "plans" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_payments" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_payments" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "layaway_items" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "layaway_items" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "layaways" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "layaways" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_reservations" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_reservations" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_count_items" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_count_items" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "inventory_counts" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "inventory_counts" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_transfers" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_transfers" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "return_items" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "return_items" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "returns" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "returns" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_outbound_messages" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_outbound_messages" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_template_statuses" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_template_statuses" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_template_catalog_entries" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_template_catalog_entries" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_accounts" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_accounts" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "customers" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "user_branches" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "user_branches" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "revenue_attribution_settings" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "revenue_attribution_settings" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "cash_movements" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "cash_movements" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "cash_sessions" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "cash_sessions" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "repair_note_payments" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "repair_note_payments" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "quote_service_types" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "quote_service_types" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "quote_items" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "quote_items" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "quotes" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "quotes" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "sale_payments" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "sale_payments" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "sale_items" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "sale_items" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "sales" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "inventory_items" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "inventory_items" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "repair_note_service_types" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "repair_note_service_types" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "service_types" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "service_types" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "repair_note_items" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "repair_note_items" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "price_list_items" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "price_list_items" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "proveedores" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "proveedores" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_templates" ALTER COLUMN "public_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_templates" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "local_config" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "local_config" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "chat_messages" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "chat_messages" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "repair_notes" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "repair_notes" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "branches" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "branches" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "usuarios" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "public_id" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`,
    );
  }
}
