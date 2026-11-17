import { MigrationInterface, QueryRunner } from "typeorm";

export class ParentForeignKeys1794887824864 implements MigrationInterface {
    name = 'ParentForeignKeys1794887824864'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Filas hijas sin padre: no se pueden alcanzar desde ninguna pantalla y la FK no
        // puede crearse con ellas. Con datos reales, revisar el conteo antes de aplicar.
        const orphans: Array<[string, string, string]> = [
            ["sale_items", "id_venta", "sales"],
            ["sale_payments", "id_venta", "sales"],
            ["quote_items", "id_cotizacion", "quotes"],
            ["repair_note_items", "id_nota_reparacion", "repair_notes"],
            ["repair_note_service_types", "id_nota_reparacion", "repair_notes"],
            ["repair_note_service_types", "id_tipo_servicio", "service_types"],
            ["cash_movements", "id_sesion_caja", "cash_sessions"],
            ["whatsapp_outbound_messages", "account_id", "whatsapp_accounts"],
            ["whatsapp_template_statuses", "account_id", "whatsapp_accounts"],
        ];
        for (const [table, column, parent] of orphans) {
            await queryRunner.query(`DELETE FROM "${table}" WHERE "${column}" NOT IN (SELECT "id" FROM "${parent}")`);
        }
        await queryRunner.query(`CREATE INDEX "IDX_repair_note_items_id_nota_reparacion" ON "repair_note_items" ("id_nota_reparacion") `);
        await queryRunner.query(`CREATE INDEX "IDX_repair_note_service_types_id_tipo_servicio" ON "repair_note_service_types" ("id_tipo_servicio") `);
        await queryRunner.query(`CREATE INDEX "IDX_repair_note_service_types_id_nota_reparacion" ON "repair_note_service_types" ("id_nota_reparacion") `);
        await queryRunner.query(`CREATE INDEX "IDX_sale_items_id_venta" ON "sale_items" ("id_venta") `);
        await queryRunner.query(`CREATE INDEX "IDX_sale_payments_id_venta" ON "sale_payments" ("id_venta") `);
        await queryRunner.query(`CREATE INDEX "IDX_quote_items_id_cotizacion" ON "quote_items" ("id_cotizacion") `);
        await queryRunner.query(`CREATE INDEX "IDX_cash_movements_id_sesion_caja" ON "cash_movements" ("id_sesion_caja") `);
        await queryRunner.query(`CREATE INDEX "IDX_whatsapp_template_statuses_account_id" ON "whatsapp_template_statuses" ("account_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_whatsapp_outbound_messages_account_id" ON "whatsapp_outbound_messages" ("account_id") `);
        await queryRunner.query(`ALTER TABLE "repair_note_items" ADD CONSTRAINT "FK_repair_note_items_id_nota_reparacion" FOREIGN KEY ("id_nota_reparacion") REFERENCES "repair_notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "repair_note_service_types" ADD CONSTRAINT "FK_repair_note_service_types_id_nota_reparacion" FOREIGN KEY ("id_nota_reparacion") REFERENCES "repair_notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "repair_note_service_types" ADD CONSTRAINT "FK_repair_note_service_types_id_tipo_servicio" FOREIGN KEY ("id_tipo_servicio") REFERENCES "service_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sale_items" ADD CONSTRAINT "FK_sale_items_id_venta" FOREIGN KEY ("id_venta") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sale_payments" ADD CONSTRAINT "FK_sale_payments_id_venta" FOREIGN KEY ("id_venta") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quote_items" ADD CONSTRAINT "FK_quote_items_id_cotizacion" FOREIGN KEY ("id_cotizacion") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cash_movements" ADD CONSTRAINT "FK_cash_movements_id_sesion_caja" FOREIGN KEY ("id_sesion_caja") REFERENCES "cash_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_statuses" ADD CONSTRAINT "FK_whatsapp_template_statuses_account_id" FOREIGN KEY ("account_id") REFERENCES "whatsapp_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "whatsapp_outbound_messages" ADD CONSTRAINT "FK_whatsapp_outbound_messages_account_id" FOREIGN KEY ("account_id") REFERENCES "whatsapp_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "whatsapp_outbound_messages" DROP CONSTRAINT "FK_whatsapp_outbound_messages_account_id"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_template_statuses" DROP CONSTRAINT "FK_whatsapp_template_statuses_account_id"`);
        await queryRunner.query(`ALTER TABLE "cash_movements" DROP CONSTRAINT "FK_cash_movements_id_sesion_caja"`);
        await queryRunner.query(`ALTER TABLE "quote_items" DROP CONSTRAINT "FK_quote_items_id_cotizacion"`);
        await queryRunner.query(`ALTER TABLE "sale_payments" DROP CONSTRAINT "FK_sale_payments_id_venta"`);
        await queryRunner.query(`ALTER TABLE "sale_items" DROP CONSTRAINT "FK_sale_items_id_venta"`);
        await queryRunner.query(`ALTER TABLE "repair_note_service_types" DROP CONSTRAINT "FK_repair_note_service_types_id_tipo_servicio"`);
        await queryRunner.query(`ALTER TABLE "repair_note_service_types" DROP CONSTRAINT "FK_repair_note_service_types_id_nota_reparacion"`);
        await queryRunner.query(`ALTER TABLE "repair_note_items" DROP CONSTRAINT "FK_repair_note_items_id_nota_reparacion"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_whatsapp_outbound_messages_account_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_whatsapp_template_statuses_account_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cash_movements_id_sesion_caja"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_quote_items_id_cotizacion"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sale_payments_id_venta"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sale_items_id_venta"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_repair_note_service_types_id_nota_reparacion"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_repair_note_service_types_id_tipo_servicio"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_repair_note_items_id_nota_reparacion"`);
    }

}
