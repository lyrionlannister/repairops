import { singleton } from "tsyringe";
import { ForbiddenError, currentUserId, lacks } from "../../../identity/authz/access.js";
import { Decimal } from "decimal.js";
import { toMoney } from "../../../core/common/utils/money.js";
import { BusinessError } from "../../../core/http/business-error.js";
import AppDataSource from "../../../core/config/data-source.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { AuditLogService, AUDIT_ACTIONS } from "../../../core/audit/services/audit-log.service.js";
import { QuoteDao } from "../daos/quote.dao.js";
import type { Page, PageRequest } from "../../../core/common/types/page.types.js";
import type { QuoteFilters } from "../types/quote-page.types.js";
import { QuoteItemDao } from "../daos/quote-item.dao.js";
import { QuoteServiceTypeDao } from "../daos/quote-service-type.dao.js";
import { Quote, QuoteStatus } from "../entities/quote.entity.js";
import { QuoteItem } from "../entities/quote-item.entity.js";
import { QuoteServiceType } from "../entities/quote-service-type.entity.js";
import { resolveOrCreateCustomer } from "../../customers/utils/resolve-customer.js";
import { LocalService } from "../../../app_platform/local/services/local.service.js";
import {
  RepairNoteService,
  type RepairNoteItemInput,
} from "../../repair-notes/services/repair-note.service.js";
import type { RepairNote } from "../../repair-notes/entities/repair-note.entity.js";
import { ServiceTypeDao } from "../../service-types/daos/service-type.dao.js";
import { InventoryItemDao } from "../../inventory/daos/inventory-item.dao.js";
import { PriceListDao } from "../../price-list/daos/price-list.dao.js";
import { InventoryItem } from "../../inventory/entities/inventory-item.entity.js";

export interface QuoteItemInput {
  inventoryItemId?: string | null;
  description: string;
  quantity: number;
  unitPrice: Decimal.Value;
}

// tenantId se excluye: AppDataSource.transaction de create() lo agrega desde
// el contexto (nunca lo manda el caller), igual criterio que InventoryService.
type CreatePayload = Omit<
  Quote,
  | "id"
  | "publicId"
  | "tenantId"
  | "quoteNumber"
  | "totalValue"
  | "status"
  | "kind"
  | "createdAt"
  | "updatedAt"
> &
  Partial<Pick<Quote, "kind">>;
type UpdatePayload = Partial<
  Omit<
    Quote,
    "id" | "publicId" | "tenantId" | "quoteNumber" | "totalValue" | "createdAt" | "updatedAt"
  >
>;

const sumItems = (items: QuoteItemInput[]): string =>
  toMoney(
    items.reduce(
      (sum, item) => sum.plus(new Decimal(item.unitPrice).times(item.quantity)),
      new Decimal(0),
    ),
  );

// Renglón con precio fijado por un humano (sin precio de referencia en el
// servidor): queda en bitácora después de crear/actualizar la cotización.
interface HumanPricedLine {
  lineKind: string;
  unitPrice: string;
}

@singleton()
export class QuoteService {
  constructor(
    private quoteDao: QuoteDao,
    private quoteItemDao: QuoteItemDao,
    private quoteServiceTypeDao: QuoteServiceTypeDao,
    private localService: LocalService,
    private repairNoteService: RepairNoteService,
    private serviceTypeDao: ServiceTypeDao,
    private itemDao: InventoryItemDao,
    private priceListDao: PriceListDao,
    // Opcional: la bitácora es best-effort (nunca rompe la cotización); un
    // servicio construido sin ella simplemente no registra precios fijados.
    private auditLog?: AuditLogService,
  ) {}

  // Precio de inventario: debe ser igual a precio_venta del item o al precio
  // de la lista de precios aplicable del tenant (proveedor + modelo). Si no
  // coincide con ninguno, el cliente está intentando fijar el precio.
  private async assertInventoryPrice(item: InventoryItem, unitPrice: Decimal.Value): Promise<void> {
    const price = new Decimal(unitPrice);
    if (price.equals(new Decimal(item.salePrice))) return;
    if (item.supplierId) {
      const listItem = await this.priceListDao.findBySupplierAndModel(item.supplierId, item.name);
      if (listItem && price.equals(new Decimal(listItem.price))) return;
    }
    throw new BusinessError("El precio no coincide con el precio de venta del producto. Recarga la página e intenta de nuevo.");
  }

  // Revalida el precio de cada renglón en el servidor: el unitPrice del
  // cliente nunca se acepta tal cual. Un renglón sin item de inventario (texto
  // libre) no tiene precio de referencia: exige unitPrice > 0 y queda en
  // bitácora como precio fijado por un humano.
  private async validateItemPrices(items: QuoteItemInput[]): Promise<HumanPricedLine[]> {
    const humanPriced: HumanPricedLine[] = [];
    for (const item of items) {
      if (item.inventoryItemId) {
        const inventoryItem = await this.itemDao.findById(item.inventoryItemId);
        if (!inventoryItem) throw new BusinessError("No encontramos el producto en el inventario");
        await this.assertInventoryPrice(inventoryItem, item.unitPrice);
      } else {
        const price = new Decimal(item.unitPrice);
        if (price.lessThanOrEqualTo(0)) {
          throw new BusinessError("El precio del renglón debe ser mayor a 0");
        }
        humanPriced.push({ lineKind: "custom", unitPrice: toMoney(price) });
      }
    }
    return humanPriced;
  }

  // Best-effort: la bitácora nunca rompe la operación que ya se creó.
  private async recordHumanPrices(entityId: string, lines: HumanPricedLine[]): Promise<void> {
    const auditLog = this.auditLog;
    if (!auditLog || lines.length === 0) return;
    const tenantId = getCurrentTenantId();
    const userId = currentUserId();
    for (const line of lines) {
      try {
        await auditLog.record({
          tenantId,
          userId,
          action: AUDIT_ACTIONS.SALES_PRICE_SET,
          entity: "quote",
          entityId,
          details: { lineKind: line.lineKind, unitPrice: line.unitPrice },
        });
      } catch (error) {
        console.error("No se pudo registrar el precio fijado en bitácora", error);
      }
    }
  }

  async getAll(branchId?: string | null): Promise<Quote[]> {
    return this.quoteDao.findAllOrdered(branchId);
  }

  async getPage(filters: QuoteFilters, request: PageRequest): Promise<Page<Quote>> {
    return this.quoteDao.findPage(filters, request);
  }

  async getById(id: string): Promise<Quote | null> {
    return this.quoteDao.findById(id);
  }

  // Las sub-lecturas pasan por findById: una cotización que el usuario no ve no deja
  // ver sus items ni tipos de servicio.
  async getItems(quoteId: string): Promise<QuoteItem[]> {
    if (!(await this.quoteDao.findById(quoteId))) return [];
    return this.quoteItemDao.findByQuoteId(quoteId);
  }

  async getServiceTypeIds(quoteId: string): Promise<string[]> {
    if (!(await this.quoteDao.findById(quoteId))) return [];
    const links = await this.quoteServiceTypeDao.findByQuoteId(quoteId);
    return links.map((l) => l.serviceTypeId);
  }

  async getServiceTypeNames(quoteId: string): Promise<string[]> {
    const [links, types] = await Promise.all([
      this.quoteServiceTypeDao.findByQuoteId(quoteId),
      this.serviceTypeDao.findAllOrdered(),
    ]);
    const nameById = new Map(types.map((t) => [t.id, t.name]));
    return links.map((l) => nameById.get(l.serviceTypeId)).filter((n): n is string => Boolean(n));
  }

  // totalValue nunca se recibe del cliente: siempre se recalcula a partir de
  // los items, para que la cotizacion y lo que muestra el PDF nunca puedan
  // desincronizarse (mismo criterio que InventoryItem.quantityOnHand).
  async create(
    data: CreatePayload,
    items: QuoteItemInput[],
    serviceTypeIds: string[] = [],
  ): Promise<Quote> {
    if (items.length === 0) {
      throw new BusinessError("La cotización debe tener al menos un producto");
    }
    const tenantId = getCurrentTenantId();
    const totalValue = sumItems(items);
    // getById ya filtra por taller, sucursal y, para el técnico, notas suyas.
    if (data.repairNoteId && !(await this.repairNoteService.getById(data.repairNoteId))) {
      throw new BusinessError("Nota no encontrada");
    }
    if (lacks("quotes.write") && !data.repairNoteId) {
      throw new ForbiddenError("Solo puedes cotizar sobre tus notas asignadas");
    }
    const humanPricedLines = await this.validateItemPrices(items);

    const savedQuote = await AppDataSource.transaction(async (manager) => {
      const quoteNumber = await this.localService.consumeFolio("quote", manager);
      const customerId = await resolveOrCreateCustomer(manager, tenantId, data);
      const quote = manager.create(Quote, {
        ...data,
        customerId,
        tenantId,
        quoteNumber,
        totalValue,
        status: "pending",
      });
      const savedQuote = await manager.save(quote);

      for (const item of items) {
        const quoteItem = manager.create(QuoteItem, {
          tenantId,
          quoteId: savedQuote.id,
          inventoryItemId: item.inventoryItemId ?? null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: toMoney(item.unitPrice),
        });
        await manager.save(quoteItem);
      }

      for (const serviceTypeId of serviceTypeIds) {
        const link = manager.create(QuoteServiceType, {
          tenantId,
          quoteId: savedQuote.id,
          serviceTypeId,
        });
        await manager.save(link);
      }

      return savedQuote;
    });

    await this.recordHumanPrices(savedQuote.id, humanPricedLines);
    return savedQuote;
  }

  async update(
    id: string,
    data: UpdatePayload,
    items?: QuoteItemInput[],
    serviceTypeIds?: string[],
  ): Promise<Quote | null> {
    if (items === undefined && serviceTypeIds === undefined) {
      return this.quoteDao.update(id, data);
    }
    if (items !== undefined && items.length === 0) {
      throw new BusinessError("La cotización debe tener al menos un producto");
    }
    const humanPricedLines = items !== undefined ? await this.validateItemPrices(items) : [];

    const tenantId = getCurrentTenantId();
    if (!(await this.quoteDao.findById(id))) return null;

    const savedQuote = await AppDataSource.transaction(async (manager) => {
      const quote = await manager.findOneBy(Quote, { id, tenantId });
      if (!quote) return null;

      if (
        data.customerId !== undefined ||
        data.customerName !== undefined ||
        data.contactNumber !== undefined
      ) {
        data.customerId = await resolveOrCreateCustomer(manager, tenantId, {
          customerId: data.customerId ?? quote.customerId,
          customerName: data.customerName ?? quote.customerName,
          contactNumber: data.contactNumber ?? quote.contactNumber,
        });
      }

      if (items !== undefined) {
        await manager.delete(QuoteItem, { quoteId: id, tenantId });
        Object.assign(quote, data, { totalValue: sumItems(items) });
      } else {
        Object.assign(quote, data);
      }
      const savedQuote = await manager.save(quote);

      if (items !== undefined) {
        for (const item of items) {
          const quoteItem = manager.create(QuoteItem, {
            tenantId,
            quoteId: id,
            inventoryItemId: item.inventoryItemId ?? null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: toMoney(item.unitPrice),
          });
          await manager.save(quoteItem);
        }
      }

      if (serviceTypeIds !== undefined) {
        await manager.delete(QuoteServiceType, { quoteId: id, tenantId });
        for (const serviceTypeId of serviceTypeIds) {
          const link = manager.create(QuoteServiceType, { tenantId, quoteId: id, serviceTypeId });
          await manager.save(link);
        }
      }

      return savedQuote;
    });

    if (savedQuote) await this.recordHumanPrices(savedQuote.id, humanPricedLines);
    return savedQuote;
  }

  // Rechazar o volver a pendiente: solo cambia el estado. Aceptar una
  // cotizacion de producto tambien solo cambia el estado -- aceptar una de
  // reparacion crea la nota (idempotente: si ya tiene nota, la devuelve tal
  // cual, nunca crea una segunda).
  async setStatus(id: string, status: QuoteStatus): Promise<Quote | null> {
    if (status !== "accepted") {
      return this.quoteDao.update(id, { status });
    }

    const quote = await this.quoteDao.findById(id);
    if (!quote) return null;
    if (quote.kind !== "repair") {
      return this.quoteDao.update(id, { status });
    }
    if (quote.repairNoteId) {
      return quote;
    }

    const note = await this.createRepairNoteFromQuote(quote);
    const updated = await this.quoteDao.update(id, { status, repairNoteId: note.id });
    return updated;
  }

  private async createRepairNoteFromQuote(quote: Quote): Promise<RepairNote> {
    const [items, serviceTypeLinks, local] = await Promise.all([
      this.quoteItemDao.findByQuoteId(quote.id),
      this.quoteServiceTypeDao.findByQuoteId(quote.id),
      this.localService.getConfig(),
    ]);
    const receivedAt = new Date().toLocaleDateString("en-CA", { timeZone: local.timeZone });
    const noteItems: RepairNoteItemInput[] = items
      .filter((item): item is QuoteItem & { inventoryItemId: string } =>
        Boolean(item.inventoryItemId),
      )
      .map((item) => ({
        inventoryItemId: item.inventoryItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));

    return this.repairNoteService.create(
      {
        localId: quote.localId,
        customerId: quote.customerId ?? undefined,
        customerName: quote.customerName,
        contactNumber: quote.contactNumber ?? undefined,
        devices: [
          {
            brand: quote.brand as string,
            model: quote.model as string,
            reportedFailure: quote.reportedFailure as string,
            serviceTypeIds: serviceTypeLinks.map((l) => l.serviceTypeId),
          },
        ],
        receivedAt,
        totalValue: quote.totalValue,
      },
      noteItems,
    );
  }

  async delete(id: string): Promise<boolean> {
    return this.quoteDao.delete(id);
  }
}
