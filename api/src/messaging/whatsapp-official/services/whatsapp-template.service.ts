import { singleton } from "tsyringe";
import { WhatsappTemplateStatusDao } from "../daos/whatsapp-template-status.dao.js";
import { WhatsappTemplateCatalogEntryDao } from "../daos/whatsapp-template-catalog-entry.dao.js";
import { WhatsappAccount } from "../entities/whatsapp-account.entity.js";
import {
  WhatsappTemplateStatus,
  WhatsappTemplateSyncStatus,
} from "../entities/whatsapp-template-status.entity.js";
import { createTemplate, listTemplates } from "../clients/whatsapp-graph.client.js";

// Meta puede devolver un status que esta fase todavia no modela (su propio
// tipo ya admite "| string" para eso) -- nunca se asume el valor crudo,
// cualquier cosa fuera de APPROVED/REJECTED se trata como PENDING.
function toSyncStatus(status: string): WhatsappTemplateSyncStatus {
  return status === "APPROVED" || status === "REJECTED" ? status : "PENDING";
}

@singleton()
export class WhatsappTemplateService {
  constructor(
    private whatsappTemplateStatusDao: WhatsappTemplateStatusDao,
    private whatsappTemplateCatalogEntryDao: WhatsappTemplateCatalogEntryDao,
  ) {}

  // Da de alta en Meta las plantillas del catálogo de EMPRESA (las "de
  // sistema" no tienen WABA que sincronizar todavía, ver plan Fase 4
  // Checkpoint 7) que falten y refresca el status de las que ya existen.
  // Varios tenants pueden compartir la misma WABA piloto (Etapa 1) -- si la
  // plantilla ya existe ahí (creada por otro tenant), solo se enlaza, nunca
  // se vuelve a crear ni se reescribe su texto. Una entrada deshabilitada
  // (`enabled: false`) no se sincroniza -- el admin la apagó a propósito.
  // `WhatsappAccount` es una sola fila mutable por tenant (ver Checkpoint 6:
  // `connectOwnAccount` la actualiza in-place, nunca crea otra) -- por eso
  // `metaTemplateId`/`accountId` se reescriben siempre con el dato fresco de
  // la WABA actual, nunca solo el status: si el tenant cambio de WABA, el
  // metaTemplateId viejo ya no sirve para nada.
  async reconcile(account: WhatsappAccount): Promise<WhatsappTemplateStatus[]> {
    const [remoteTemplates, entries] = await Promise.all([
      listTemplates(account.wabaId, account.accessToken),
      this.whatsappTemplateCatalogEntryDao.getOrSeedDefaultsForTenant(),
    ]);
    const results: WhatsappTemplateStatus[] = [];

    for (const entry of entries.filter((e) => e.enabled)) {
      const row = await this.whatsappTemplateStatusDao.findByCatalogEntryId(entry.id);
      const remote = remoteTemplates.find((t) => t.name === entry.metaName);
      const source = remote ?? (await createTemplate(account.wabaId, account.accessToken, entry));
      const data = {
        accountId: account.id,
        catalogEntryId: entry.id,
        metaTemplateId: source.id,
        status: toSyncStatus(source.status),
        lastSyncedAt: new Date(),
      };
      const saved = row
        ? await this.whatsappTemplateStatusDao.update(row.id, data)
        : await this.whatsappTemplateStatusDao.create(data);

      if (saved) results.push(saved);
    }

    return results;
  }
}
