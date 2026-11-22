import { IsNull, Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { WhatsappTemplateCatalogEntry } from "../entities/whatsapp-template-catalog-entry.entity.js";
import { BaseDao } from "../../../core/daos/base.dao.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";

// No extiende TenantScopedDao: tenantId es NULLABLE a proposito en esta
// entidad (NULL = fila "de sistema", ver plan Fase 4 Checkpoint 7), y
// TenantScopedDao exige tenantId: string no nulo (TenantOwned) -- extenderla
// aqui violaria ese contrato. Los metodos "ForTenant" de abajo inyectan
// tenantId a mano desde getCurrentTenantId() (mismo filtro que
// TenantScopedDao aplicaria); los metodos "System" usan tenantId: null y
// NUNCA llaman getCurrentTenantId() -- las rutas que los exponen estan
// gateadas por platform.templates.manage, no por tenant (ver whatsapp-template-catalog.routes.ts).
@singleton()
export class WhatsappTemplateCatalogEntryDao extends BaseDao<WhatsappTemplateCatalogEntry> {
  constructor(
    @inject(repositoryToken(WhatsappTemplateCatalogEntry))
    repository: Repository<WhatsappTemplateCatalogEntry>,
  ) {
    super(repository);
  }

  async findAllForTenant(): Promise<WhatsappTemplateCatalogEntry[]> {
    const tenantId = getCurrentTenantId();
    return this.repository.find({ where: { tenantId } });
  }

  // Semilla de `order_ready` por tenant (mismo patron findOrCreate que
  // WhatsappAccountDao.getOrCreateForTenant/LocalDao) -- un tenant nuevo no
  // tiene ninguna fila hasta su primer reconcile/listado, y sin esto nunca
  // llegaria a existir. Mismos valores que tenia templates/catalog.ts.
  async getOrSeedDefaultsForTenant(): Promise<WhatsappTemplateCatalogEntry[]> {
    const existing = await this.findAllForTenant();
    if (existing.length > 0) return existing;
    const seeded = await this.createForTenant({
      key: "order_ready",
      metaName: "orden_lista_recoger",
      category: "UTILITY",
      language: "es_MX",
      text: "Hola {{nombre}}, tu equipo {{modelo}} ya está listo para recoger en nuestra sucursal.",
      variables: ["nombre", "modelo"],
      triggerEvent: "repair_note.status_changed_to_terminada",
      enabled: true,
    });
    return [seeded];
  }

  async findByKeyForTenant(key: string): Promise<WhatsappTemplateCatalogEntry | null> {
    const tenantId = getCurrentTenantId();
    return this.repository.findOneBy({ tenantId, key });
  }

  async findByIdForTenant(id: string): Promise<WhatsappTemplateCatalogEntry | null> {
    const tenantId = getCurrentTenantId();
    const entry = await super.findById(id);
    if (!entry || entry.tenantId !== tenantId) return null;
    return entry;
  }

  async createForTenant(
    data: Omit<Partial<WhatsappTemplateCatalogEntry>, "tenantId">,
  ): Promise<WhatsappTemplateCatalogEntry> {
    const tenantId = getCurrentTenantId();
    return super.create({ ...data, tenantId });
  }

  async updateForTenant(
    id: string,
    data: Partial<WhatsappTemplateCatalogEntry>,
  ): Promise<WhatsappTemplateCatalogEntry | null> {
    const existing = await this.findByIdForTenant(id);
    if (!existing) return null;
    return super.update(id, data);
  }

  async deleteForTenant(id: string): Promise<boolean> {
    const existing = await this.findByIdForTenant(id);
    if (!existing) return false;
    return super.delete(id);
  }

  async copySystemToTenant(): Promise<WhatsappTemplateCatalogEntry[]> {
    const [systemEntries, tenantEntries] = await Promise.all([
      this.findAllSystem(),
      this.findAllForTenant(),
    ]);
    const missing = systemEntries.filter(
      (system) =>
        !tenantEntries.some((own) => own.key === system.key || own.metaName === system.metaName),
    );
    const copies: WhatsappTemplateCatalogEntry[] = [];
    for (const system of missing) {
      copies.push(
        await this.createForTenant({
          key: system.key,
          metaName: system.metaName,
          category: system.category,
          language: system.language,
          text: system.text,
          variables: system.variables,
          triggerEvent: system.triggerEvent,
          enabled: system.enabled,
        }),
      );
    }
    return copies;
  }

  async findAllSystem(): Promise<WhatsappTemplateCatalogEntry[]> {
    return this.repository.find({ where: { tenantId: IsNull() } });
  }

  async findByIdSystem(id: string): Promise<WhatsappTemplateCatalogEntry | null> {
    const entry = await super.findById(id);
    if (!entry || entry.tenantId !== null) return null;
    return entry;
  }

  async createSystem(
    data: Omit<Partial<WhatsappTemplateCatalogEntry>, "tenantId">,
  ): Promise<WhatsappTemplateCatalogEntry> {
    return super.create({ ...data, tenantId: null });
  }

  async updateSystem(
    id: string,
    data: Partial<WhatsappTemplateCatalogEntry>,
  ): Promise<WhatsappTemplateCatalogEntry | null> {
    const existing = await this.findByIdSystem(id);
    if (!existing) return null;
    return super.update(id, data);
  }

  async deleteSystem(id: string): Promise<boolean> {
    const existing = await this.findByIdSystem(id);
    if (!existing) return false;
    return super.delete(id);
  }
}
