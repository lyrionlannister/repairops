import "reflect-metadata";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../src/core/config/data-source.js";
import { Tenant } from "../../../src/core/tenancy/entities/tenant.entity.js";
import { Customer } from "../../../src/commerce/customers/entities/customer.entity.js";
import { Branch } from "../../../src/identity/branches/entities/branch.entity.js";
import { ChatMessage } from "../../../src/messaging/chats/entities/chat-message.entity.js";
import { WhatsappSettings } from "../../../src/messaging/whatsapp-admin/entities/whatsapp-settings.entity.js";

// Integridad del esquema (modulo cleanup): toda tabla con tenant_id tiene FK real a
// tenants con ON DELETE CASCADE y un indice que empieza por tenant_id.
describe("integridad por tenant", () => {
  beforeAll(async () => {
    await AppDataSource.initialize();
  });
  afterAll(async () => {
    await AppDataSource.destroy();
  });

  const tenantTables = async (): Promise<string[]> =>
    (
      await AppDataSource.query(
        `SELECT table_name FROM information_schema.columns
         WHERE column_name = 'tenant_id' AND table_schema = 'public' AND table_name <> 'migrations' ORDER BY 1`,
      )
    ).map((row: { table_name: string }) => row.table_name);

  it("toda tabla con tenant_id tiene FK en cascada hacia tenants", async () => {
    const tables = await tenantTables();
    expect(tables.length).toBeGreaterThan(30);
    const withFk: Array<{ table_name: string; delete_rule: string }> = await AppDataSource.query(
      `SELECT tc.table_name, rc.delete_rule
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage k ON k.constraint_name = tc.constraint_name AND k.table_schema = tc.table_schema
       JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
       JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
       WHERE tc.constraint_type = 'FOREIGN KEY' AND k.column_name = 'tenant_id' AND ccu.table_name = 'tenants'`,
    );
    const rules = new Map(withFk.map((row) => [row.table_name, row.delete_rule]));
    const missing = tables.filter((table) => rules.get(table) !== "CASCADE");
    expect(missing).toEqual([]);
  });

  it("toda tabla con tenant_id tiene un indice que empieza por tenant_id", async () => {
    const indexed: Array<{ relname: string }> = await AppDataSource.query(
      `SELECT DISTINCT t.relname FROM pg_index i
       JOIN pg_class t ON t.oid = i.indrelid
       JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = i.indkey[0]
       WHERE a.attname = 'tenant_id'`,
    );
    const set = new Set(indexed.map((row) => row.relname));
    expect((await tenantTables()).filter((table) => !set.has(table))).toEqual([]);
  });

  it("borrar un tenant no deja ninguna fila suya en ninguna tabla", async () => {
    const tenants = AppDataSource.getRepository(Tenant);
    const tenant = await tenants.save(tenants.create({ name: "integridad-test" }));
    const tenantId = tenant.id;

    await AppDataSource.getRepository(Customer).save({ tenantId, name: "Cliente", phone: "555" } as Partial<Customer>);
    await AppDataSource.getRepository(Branch).save({ tenantId, name: "Sucursal" } as Partial<Branch>);
    await AppDataSource.getRepository(ChatMessage).query(
      `INSERT INTO chat_messages (tenant_id, contact_phone, direction, sender, body) VALUES ($1, '5215500000000', 'inbound', 'customer', 'hola')`,
      [tenantId],
    );
    await AppDataSource.getRepository(WhatsappSettings).save({ tenantId, aiRepliesEnabled: true } as Partial<WhatsappSettings>);

    await tenants.delete(tenantId);

    const leftovers: string[] = [];
    for (const table of await tenantTables()) {
      const [{ count }] = await AppDataSource.query(`SELECT count(*)::int AS count FROM "${table}" WHERE tenant_id = $1`, [tenantId]);
      if (count > 0) leftovers.push(table);
    }
    expect(leftovers).toEqual([]);
  });

  it("toda columna local_id y branch_id tiene FK a branches", async () => {
    const columns: Array<{ table_name: string; column_name: string }> = await AppDataSource.query(
      `SELECT table_name, column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND column_name IN ('local_id', 'branch_id') AND table_name <> 'local_config'`,
    );
    const fks: Array<{ table_name: string; column_name: string }> = await AppDataSource.query(
      `SELECT tc.table_name, k.column_name FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage k ON k.constraint_name = tc.constraint_name AND k.table_schema = tc.table_schema
       JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
       WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'branches'`,
    );
    const have = new Set(fks.map((row) => row.table_name + "." + row.column_name));
    expect(columns.filter((c) => !have.has(c.table_name + "." + c.column_name))).toEqual([]);
  });

  it("admin no es un rol del tenant: ningun requireRole ni tipo de rol lo menciona", () => {
    const root = join(__dirname, "../../../src");
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (path.endsWith(".ts") && /requireRole\([^)]*"admin"|UserRole =[^;]*"admin"|ROLES[^;]*"admin"/.test(readFileSync(path, "utf8"))) offenders.push(path);
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
  });
});
