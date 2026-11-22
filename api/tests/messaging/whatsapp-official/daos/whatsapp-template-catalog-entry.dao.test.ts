import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { WhatsappTemplateCatalogEntry } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-template-catalog-entry.entity.js";
import { WhatsappTemplateCatalogEntryDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-template-catalog-entry.dao.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

describe("WhatsappTemplateCatalogEntryDao.copySystemToTenant", () => {
  let dao: WhatsappTemplateCatalogEntryDao;
  const base = Date.now();
  const tenantA = `${base}1`;
  const tenantB = `${base}2`;
  // Las filas de sistema son globales: keys unicas por corrida para no chocar
  // con el indice parcial UQ_wa_template_catalog_system_key ni con otras pruebas.
  const systemKey = `sys_${base}`;
  const clashingKey = `sys_clash_${base}`;
  const systemIds: string[] = [];

  beforeAll(async () => {
    await AppDataSource.initialize();
    dao = new WhatsappTemplateCatalogEntryDao(
      AppDataSource.getRepository(WhatsappTemplateCatalogEntry),
    );
    for (const key of [systemKey, clashingKey]) {
      const created = await dao.createSystem({
        key,
        metaName: key,
        category: "UTILITY",
        language: "es_MX",
        text: `Texto de sistema ${key}`,
        variables: [],
        triggerEvent: null,
        enabled: true,
      });
      systemIds.push(created.id);
    }
  });

  afterAll(async () => {
    for (const id of systemIds) await dao.deleteSystem(id);
    await AppDataSource.destroy();
  });

  it("copies system entries into the current tenant only", async () => {
    await runWithTenant(tenantA, () => dao.copySystemToTenant());

    const keysA = (await runWithTenant(tenantA, () => dao.findAllForTenant())).map((e) => e.key);
    const keysB = (await runWithTenant(tenantB, () => dao.findAllForTenant())).map((e) => e.key);

    expect(keysA).toEqual(expect.arrayContaining([systemKey, clashingKey]));
    expect(keysB).not.toContain(systemKey);
  });

  it("is idempotent and never overwrites an entry the tenant already has", async () => {
    await runWithTenant(tenantB, () =>
      dao.createForTenant({
        key: clashingKey,
        metaName: clashingKey,
        category: "UTILITY",
        language: "es_MX",
        text: "Texto editado por el taller",
        variables: [],
        triggerEvent: null,
        enabled: true,
      }),
    );

    await runWithTenant(tenantB, () => dao.copySystemToTenant());
    await runWithTenant(tenantB, () => dao.copySystemToTenant());

    const entriesB = await runWithTenant(tenantB, () => dao.findAllForTenant());
    const ownClash = entriesB.filter((e) => e.key === clashingKey);
    expect(ownClash).toHaveLength(1);
    expect(ownClash[0].text).toBe("Texto editado por el taller");
    expect(entriesB.filter((e) => e.key === systemKey)).toHaveLength(1);
  });

  it("a tenant copy is never visible as a system entry", async () => {
    const systemKeys = (await dao.findAllSystem()).map((e) => e.key);
    expect(systemKeys.filter((k) => k === systemKey)).toHaveLength(1);
  });
});
