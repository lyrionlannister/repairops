import { MigrationInterface, QueryRunner } from "typeorm";

// Busqueda y paginacion en el servidor. Las busquedas son ILIKE '%texto%': un btree no
// sirve para un comodin al inicio, los GIN trigram si. Los compuestos sostienen el orden
// por fecha/nombre de cada listado sin ordenar la tabla completa del taller.
const BTREE: Array<[string, string, string]> = [
  ["IDX_customers_tenant_name", "customers", '"tenant_id", "nombre"'],
  ["IDX_inventory_items_tenant_name", "inventory_items", '"tenant_id", "nombre"'],
  ["IDX_quotes_tenant_created", "quotes", '"tenant_id", "fecha_creacion"'],
  ["IDX_quotes_customer", "quotes", '"customer_id"'],
  ["IDX_layaways_tenant_created", "layaways", '"tenant_id", "fecha_creacion"'],
  ["IDX_layaways_tenant_status_expires", "layaways", '"tenant_id", "estado", "fecha_vencimiento"'],
  ["IDX_layaways_customer", "layaways", '"id_cliente"'],
  ["IDX_inventory_transfers_tenant_created", "inventory_transfers", '"tenant_id", "fecha_creacion"'],
  ["IDX_inventory_movements_item_created", "inventory_movements", '"id_item_inventario", "fecha_creacion"'],
  ["IDX_cash_sessions_tenant_closed", "cash_sessions", '"tenant_id", "fecha_cierre"'],
  ["IDX_sales_customer", "sales", '"customer_id"'],
  ["IDX_repair_notes_customer", "repair_notes", '"customer_id"'],
  ["IDX_price_list_items_tenant_brand_model", "price_list_items", '"tenant_id", "marca", "modelo"'],
];

const TRGM: Array<[string, string, string]> = [
  ["IDX_customers_nombre_trgm", "customers", "nombre"],
  ["IDX_customers_telefono_trgm", "customers", "telefono"],
  ["IDX_customers_email_trgm", "customers", "email"],
  ["IDX_inventory_items_nombre_trgm", "inventory_items", "nombre"],
  ["IDX_inventory_items_sku_trgm", "inventory_items", "sku"],
  ["IDX_quotes_nombre_cliente_trgm", "quotes", "nombre_cliente"],
  ["IDX_sales_nombre_cliente_trgm", "sales", "nombre_cliente"],
  ["IDX_repair_notes_nombre_cliente_trgm", "repair_notes", "nombre_cliente"],
  ["IDX_price_list_items_marca_trgm", "price_list_items", "marca"],
  ["IDX_price_list_items_modelo_trgm", "price_list_items", "modelo"],
];

export class AddSearchAndListingIndexes1795600000029 implements MigrationInterface {
  name = "AddSearchAndListingIndexes1795600000029";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    for (const [name, table, columns] of BTREE) {
      await queryRunner.query(`CREATE INDEX "${name}" ON "${table}" (${columns})`);
    }
    for (const [name, table, column] of TRGM) {
      await queryRunner.query(`CREATE INDEX "${name}" ON "${table}" USING gin ("${column}" gin_trgm_ops)`);
    }
  }

  // La extension se conserva: otra base o migracion futura puede depender de ella.
  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [name] of [...TRGM, ...BTREE].reverse()) {
      await queryRunner.query(`DROP INDEX "public"."${name}"`);
    }
  }
}
