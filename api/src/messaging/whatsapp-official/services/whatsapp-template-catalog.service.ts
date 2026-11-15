import { singleton } from "tsyringe";
import { WhatsappTemplateCatalogEntryDao } from "../daos/whatsapp-template-catalog-entry.dao.js";
import { WhatsappTemplateStatusDao } from "../daos/whatsapp-template-status.dao.js";
import { WhatsappAccountService } from "./whatsapp-account.service.js";
import { WhatsappTemplateCatalogEntry } from "../entities/whatsapp-template-catalog-entry.entity.js";
import { CreateWhatsappTemplateCatalogEntryDto } from "../dtos/create-whatsapp-template-catalog-entry.dto.js";
import { UpdateWhatsappTemplateCatalogEntryDto } from "../dtos/update-whatsapp-template-catalog-entry.dto.js";
import { updateTemplate, deleteTemplate } from "../clients/whatsapp-graph.client.js";

// Key/metaName duplicados dentro del mismo scope -- se detecta antes de
// tocar la DB para responder 400 limpio, nunca el 500 crudo de la
// constraint (ver plan Fase 4, Checkpoint 7, Tarea 7.2).
export class WhatsappTemplateCatalogConflictError extends Error {}

function buildPatch(dto: UpdateWhatsappTemplateCatalogEntryDto): Partial<WhatsappTemplateCatalogEntry> {
  const patch: Partial<WhatsappTemplateCatalogEntry> = {};
  if (dto.text !== undefined) patch.text = dto.text;
  if (dto.variables !== undefined) patch.variables = dto.variables;
  if (dto.enabled !== undefined) patch.enabled = dto.enabled;
  return patch;
}

@singleton()
export class WhatsappTemplateCatalogService {
  constructor(
    private whatsappTemplateCatalogEntryDao: WhatsappTemplateCatalogEntryDao,
    private whatsappTemplateStatusDao: WhatsappTemplateStatusDao,
    private whatsappAccountService: WhatsappAccountService,
  ) {}

  // -- Empresa (tenant actual) --

  async listForTenant(): Promise<WhatsappTemplateCatalogEntry[]> {
    return this.whatsappTemplateCatalogEntryDao.getOrSeedDefaultsForTenant();
  }

  async create(dto: CreateWhatsappTemplateCatalogEntryDto): Promise<WhatsappTemplateCatalogEntry> {
    const existing = await this.whatsappTemplateCatalogEntryDao.findAllForTenant();
    if (existing.some((e) => e.key === dto.key)) {
      throw new WhatsappTemplateCatalogConflictError(`Ya existe una plantilla con key "${dto.key}"`);
    }
    if (existing.some((e) => e.metaName === dto.metaName)) {
      throw new WhatsappTemplateCatalogConflictError(`Ya existe una plantilla con metaName "${dto.metaName}"`);
    }
    return this.whatsappTemplateCatalogEntryDao.createForTenant({ ...dto, triggerEvent: null, enabled: true });
  }

  // Solo texto/variables/enabled son editables. Si la plantilla ya está
  // registrada en Meta (tiene metaTemplateId), el cambio de texto/variables
  // se manda también allá -- Meta reinicia su revisión, por eso el status
  // local vuelve a PENDING. Si todavía no se sincronizó nunca, el siguiente
  // reconcile la crea ya con el texto nuevo, sin paso aparte.
  async update(id: string, dto: UpdateWhatsappTemplateCatalogEntryDto): Promise<WhatsappTemplateCatalogEntry | null> {
    const entry = await this.whatsappTemplateCatalogEntryDao.findByIdForTenant(id);
    if (!entry) return null;

    const patch = buildPatch(dto);
    const status = await this.whatsappTemplateStatusDao.findByCatalogEntryId(entry.id);
    if (status?.metaTemplateId && (dto.text !== undefined || dto.variables !== undefined)) {
      const account = await this.whatsappAccountService.getOrCreateForTenant();
      await updateTemplate(status.metaTemplateId, account.accessToken, {
        metaName: entry.metaName,
        category: entry.category,
        language: entry.language,
        text: patch.text ?? entry.text,
        variables: patch.variables ?? entry.variables,
      });
      await this.whatsappTemplateStatusDao.update(status.id, { status: "PENDING", lastSyncedAt: new Date() });
    }

    return this.whatsappTemplateCatalogEntryDao.updateForTenant(id, patch);
  }

  // Borra primero en Meta -- solo si Meta confirma (o nunca se había
  // sincronizado) se borra la fila local; si Meta rechaza, no se toca nada
  // local y se propaga su mensaje real.
  async delete(id: string): Promise<boolean> {
    const entry = await this.whatsappTemplateCatalogEntryDao.findByIdForTenant(id);
    if (!entry) return false;

    const status = await this.whatsappTemplateStatusDao.findByCatalogEntryId(entry.id);
    if (status?.metaTemplateId) {
      const account = await this.whatsappAccountService.getOrCreateForTenant();
      await deleteTemplate(account.wabaId, account.accessToken, entry.metaName);
    }

    return this.whatsappTemplateCatalogEntryDao.deleteForTenant(id);
  }

  // -- Sistema (isPlatformAdmin) --
  // Boundary de Checkpoint 7: todavía no existe una WhatsappAccount de
  // sistema (sin tenant) -- estas filas son CRUD puro en DB, sin llamar a
  // Meta. Cuando exista un consumidor real (ej. Fase 6), ese checkpoint
  // decide cómo se sincronizan -- no se inventa aquí.

  async listSystem(): Promise<WhatsappTemplateCatalogEntry[]> {
    return this.whatsappTemplateCatalogEntryDao.findAllSystem();
  }

  async createSystem(dto: CreateWhatsappTemplateCatalogEntryDto): Promise<WhatsappTemplateCatalogEntry> {
    const existing = await this.whatsappTemplateCatalogEntryDao.findAllSystem();
    if (existing.some((e) => e.key === dto.key)) {
      throw new WhatsappTemplateCatalogConflictError(`Ya existe una plantilla de sistema con key "${dto.key}"`);
    }
    if (existing.some((e) => e.metaName === dto.metaName)) {
      throw new WhatsappTemplateCatalogConflictError(`Ya existe una plantilla de sistema con metaName "${dto.metaName}"`);
    }
    return this.whatsappTemplateCatalogEntryDao.createSystem({ ...dto, triggerEvent: null, enabled: true });
  }

  async updateSystem(
    id: string,
    dto: UpdateWhatsappTemplateCatalogEntryDto,
  ): Promise<WhatsappTemplateCatalogEntry | null> {
    return this.whatsappTemplateCatalogEntryDao.updateSystem(id, buildPatch(dto));
  }

  async deleteSystem(id: string): Promise<boolean> {
    return this.whatsappTemplateCatalogEntryDao.deleteSystem(id);
  }
}
