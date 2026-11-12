import { WhatsappTemplateStatusDao } from "../daos/whatsapp-template-status.dao.js";
import { WhatsappAccount } from "../entities/whatsapp-account.entity.js";
import { WhatsappTemplateStatus } from "../entities/whatsapp-template-status.entity.js";
import { templateCatalog } from "../templates/catalog.js";
import { createTemplate, listTemplates } from "../clients/whatsapp-graph.client.js";

export class WhatsappTemplateService {
  constructor(private whatsappTemplateStatusDao: WhatsappTemplateStatusDao) {}

  // Da de alta en Meta las plantillas del catálogo que falten y refresca el
  // status de las que ya existen. Varios tenants pueden compartir la misma
  // WABA piloto (Etapa 1) -- si la plantilla ya existe ahí (creada por otro
  // tenant), solo se enlaza, nunca se vuelve a crear ni se reescribe su texto.
  async reconcile(account: WhatsappAccount): Promise<WhatsappTemplateStatus[]> {
    const remoteTemplates = await listTemplates(account.wabaId, account.accessToken);
    const results: WhatsappTemplateStatus[] = [];

    for (const entry of templateCatalog) {
      let row = await this.whatsappTemplateStatusDao.findByCatalogKey(entry.key);
      const remote = remoteTemplates.find((t) => t.name === entry.metaName);

      if (!row && !remote) {
        const created = await createTemplate(account.wabaId, account.accessToken, entry);
        row = await this.whatsappTemplateStatusDao.create({
          accountId: account.id,
          catalogKey: entry.key,
          metaTemplateId: created.id,
          status: (created.status as any) || "PENDING",
          lastSyncedAt: new Date(),
        });
      } else if (!row && remote) {
        row = await this.whatsappTemplateStatusDao.create({
          accountId: account.id,
          catalogKey: entry.key,
          metaTemplateId: remote.id,
          status: remote.status as any,
          lastSyncedAt: new Date(),
        });
      } else if (row && remote) {
        row = await this.whatsappTemplateStatusDao.update(row.id, {
          status: remote.status as any,
          lastSyncedAt: new Date(),
        });
      }

      if (row) results.push(row);
    }

    return results;
  }
}
