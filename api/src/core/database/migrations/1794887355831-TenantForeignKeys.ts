import { MigrationInterface, QueryRunner } from "typeorm";

export class TenantForeignKeys1794887355831 implements MigrationInterface {
    name = 'TenantForeignKeys1794887355831'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Antes de poner la FK se borran las filas cuyo tenant ya no existe: nadie puede
        // alcanzarlas (todo acceso filtra por tenant) y la FK no puede crearse con ellas.
        // En el entorno de desarrollo son restos de pruebas de integracion con tenants
        // inventados. Con datos reales, revisar el conteo antes de aplicar.
        // Orden: tablas hijas primero, por las FK que ya existen entre ellas.
        const tablesWithTenant = [
            "whatsapp_template_statuses",
            "whatsapp_template_catalog_entries",
            "layaway_items",
            "layaways",
            "customers",
            "return_items",
            "returns",
            "sale_items",
            "sale_payments",
            "sales",
            "inventory_count_items",
            "inventory_counts",
            "inventory_reservations",
            "inventory_transfers",
            "inventory_movements",
            "price_list_items",
            "inventory_items",
            "proveedores",
            "branches",
            "cash_movements",
            "cash_sessions",
            "excluded_phone",
            "local_config",
            "message_templates",
            "notifications",
            "quote_items",
            "quotes",
            "repair_note_items",
            "repair_note_service_types",
            "repair_notes",
            "revenue_attribution_settings",
            "service_types",
            "usuarios",
            "whatsapp_accounts",
            "whatsapp_outbound_messages",
            "whatsapp_settings",
        ];
        for (const table of tablesWithTenant) {
            await queryRunner.query(`DELETE FROM "${table}" WHERE "tenant_id" IS NOT NULL AND "tenant_id" NOT IN (SELECT "id" FROM "tenants")`);
        }
        await queryRunner.query(`CREATE INDEX "IDX_usuarios_tenant" ON "usuarios" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_proveedores_tenant" ON "proveedores" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_price_list_items_tenant" ON "price_list_items" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_tenant" ON "notifications" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_repair_note_items_tenant" ON "repair_note_items" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_repair_note_service_types_tenant" ON "repair_note_service_types" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_service_types_tenant" ON "service_types" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_inventory_items_tenant" ON "inventory_items" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_inventory_movements_tenant" ON "inventory_movements" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_sale_items_tenant" ON "sale_items" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_sale_payments_tenant" ON "sale_payments" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_quotes_tenant" ON "quotes" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_quote_items_tenant" ON "quote_items" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_cash_sessions_tenant" ON "cash_sessions" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_branches_tenant" ON "branches" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_customers_tenant" ON "customers" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_return_items_tenant" ON "return_items" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_inventory_transfers_tenant" ON "inventory_transfers" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_inventory_counts_tenant" ON "inventory_counts" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_inventory_count_items_tenant" ON "inventory_count_items" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_inventory_reservations_tenant" ON "inventory_reservations" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_layaways_tenant" ON "layaways" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_layaway_items_tenant" ON "layaway_items" ("tenant_id") `);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD CONSTRAINT "FK_usuarios_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "excluded_phone" ADD CONSTRAINT "FK_excluded_phone_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "whatsapp_settings" ADD CONSTRAINT "FK_whatsapp_settings_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "repair_notes" ADD CONSTRAINT "FK_repair_notes_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "local_config" ADD CONSTRAINT "FK_local_config_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_templates" ADD CONSTRAINT "FK_message_templates_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "proveedores" ADD CONSTRAINT "FK_proveedores_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "price_list_items" ADD CONSTRAINT "FK_price_list_items_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "repair_note_items" ADD CONSTRAINT "FK_repair_note_items_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "repair_note_service_types" ADD CONSTRAINT "FK_repair_note_service_types_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_types" ADD CONSTRAINT "FK_service_types_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_items" ADD CONSTRAINT "FK_inventory_items_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_inventory_movements_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "FK_sales_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sale_items" ADD CONSTRAINT "FK_sale_items_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sale_payments" ADD CONSTRAINT "FK_sale_payments_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quotes" ADD CONSTRAINT "FK_quotes_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quote_items" ADD CONSTRAINT "FK_quote_items_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cash_sessions" ADD CONSTRAINT "FK_cash_sessions_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cash_movements" ADD CONSTRAINT "FK_cash_movements_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "revenue_attribution_settings" ADD CONSTRAINT "FK_revenue_attribution_settings_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "branches" ADD CONSTRAINT "FK_branches_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_customers_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "whatsapp_accounts" ADD CONSTRAINT "FK_whatsapp_accounts_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_catalog_entries" ADD CONSTRAINT "FK_whatsapp_template_catalog_entries_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_statuses" ADD CONSTRAINT "FK_whatsapp_template_statuses_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "whatsapp_outbound_messages" ADD CONSTRAINT "FK_whatsapp_outbound_messages_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "returns" ADD CONSTRAINT "FK_returns_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "return_items" ADD CONSTRAINT "FK_return_items_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_transfers" ADD CONSTRAINT "FK_inventory_transfers_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_counts" ADD CONSTRAINT "FK_inventory_counts_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_count_items" ADD CONSTRAINT "FK_inventory_count_items_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" ADD CONSTRAINT "FK_inventory_reservations_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "layaways" ADD CONSTRAINT "FK_layaways_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "layaway_items" ADD CONSTRAINT "FK_layaway_items_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "layaway_items" DROP CONSTRAINT "FK_layaway_items_tenant"`);
        await queryRunner.query(`ALTER TABLE "layaways" DROP CONSTRAINT "FK_layaways_tenant"`);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" DROP CONSTRAINT "FK_inventory_reservations_tenant"`);
        await queryRunner.query(`ALTER TABLE "inventory_count_items" DROP CONSTRAINT "FK_inventory_count_items_tenant"`);
        await queryRunner.query(`ALTER TABLE "inventory_counts" DROP CONSTRAINT "FK_inventory_counts_tenant"`);
        await queryRunner.query(`ALTER TABLE "inventory_transfers" DROP CONSTRAINT "FK_inventory_transfers_tenant"`);
        await queryRunner.query(`ALTER TABLE "return_items" DROP CONSTRAINT "FK_return_items_tenant"`);
        await queryRunner.query(`ALTER TABLE "returns" DROP CONSTRAINT "FK_returns_tenant"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_outbound_messages" DROP CONSTRAINT "FK_whatsapp_outbound_messages_tenant"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_statuses" DROP CONSTRAINT "FK_whatsapp_template_statuses_tenant"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_catalog_entries" DROP CONSTRAINT "FK_whatsapp_template_catalog_entries_tenant"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_accounts" DROP CONSTRAINT "FK_whatsapp_accounts_tenant"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_customers_tenant"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP CONSTRAINT "FK_branches_tenant"`);
        await queryRunner.query(`ALTER TABLE "revenue_attribution_settings" DROP CONSTRAINT "FK_revenue_attribution_settings_tenant"`);
        await queryRunner.query(`ALTER TABLE "cash_movements" DROP CONSTRAINT "FK_cash_movements_tenant"`);
        await queryRunner.query(`ALTER TABLE "cash_sessions" DROP CONSTRAINT "FK_cash_sessions_tenant"`);
        await queryRunner.query(`ALTER TABLE "quote_items" DROP CONSTRAINT "FK_quote_items_tenant"`);
        await queryRunner.query(`ALTER TABLE "quotes" DROP CONSTRAINT "FK_quotes_tenant"`);
        await queryRunner.query(`ALTER TABLE "sale_payments" DROP CONSTRAINT "FK_sale_payments_tenant"`);
        await queryRunner.query(`ALTER TABLE "sale_items" DROP CONSTRAINT "FK_sale_items_tenant"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_sales_tenant"`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_inventory_movements_tenant"`);
        await queryRunner.query(`ALTER TABLE "inventory_items" DROP CONSTRAINT "FK_inventory_items_tenant"`);
        await queryRunner.query(`ALTER TABLE "service_types" DROP CONSTRAINT "FK_service_types_tenant"`);
        await queryRunner.query(`ALTER TABLE "repair_note_service_types" DROP CONSTRAINT "FK_repair_note_service_types_tenant"`);
        await queryRunner.query(`ALTER TABLE "repair_note_items" DROP CONSTRAINT "FK_repair_note_items_tenant"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_tenant"`);
        await queryRunner.query(`ALTER TABLE "price_list_items" DROP CONSTRAINT "FK_price_list_items_tenant"`);
        await queryRunner.query(`ALTER TABLE "proveedores" DROP CONSTRAINT "FK_proveedores_tenant"`);
        await queryRunner.query(`ALTER TABLE "message_templates" DROP CONSTRAINT "FK_message_templates_tenant"`);
        await queryRunner.query(`ALTER TABLE "local_config" DROP CONSTRAINT "FK_local_config_tenant"`);
        await queryRunner.query(`ALTER TABLE "repair_notes" DROP CONSTRAINT "FK_repair_notes_tenant"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_settings" DROP CONSTRAINT "FK_whatsapp_settings_tenant"`);
        await queryRunner.query(`ALTER TABLE "excluded_phone" DROP CONSTRAINT "FK_excluded_phone_tenant"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP CONSTRAINT "FK_usuarios_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_layaway_items_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_layaways_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_inventory_reservations_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_inventory_count_items_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_inventory_counts_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_inventory_transfers_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_return_items_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_customers_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_branches_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cash_sessions_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_quote_items_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_quotes_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sale_payments_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sale_items_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_inventory_movements_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_inventory_items_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_service_types_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_repair_note_service_types_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_repair_note_items_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_price_list_items_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_proveedores_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_usuarios_tenant"`);
    }

}
