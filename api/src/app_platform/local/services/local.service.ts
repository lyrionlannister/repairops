import { singleton } from "tsyringe";
import type { EntityManager } from "typeorm";
import { LocalDao, type FolioKind } from "../daos/local.dao.js";
import type { UpdateLocalDto } from "../dtos/update-local.dto.js";
import { toMoney } from "../../../core/common/utils/money.js";
import { Local } from "../entities/local.entity.js";
import { rasterizeLogoIfSvg } from "../../../core/common/utils/rasterize-logo.js";
import {
  buildBrandPalette,
  BRAND_COLOR_PATTERN,
  type BrandPalette,
} from "../utils/brand-palette.js";

export class LocalValidationError extends Error {}

const FOLIO_FIELDS: ReadonlyArray<{
  field: keyof UpdateLocalDto & keyof Local;
  kind: FolioKind;
  label: string;
}> = [
  { field: "nextControlNumber", kind: "control", label: "notas" },
  { field: "nextSaleNumber", kind: "sale", label: "ventas" },
  { field: "nextReturnNumber", kind: "return", label: "devoluciones" },
  { field: "nextQuoteNumber", kind: "quote", label: "cotizaciones" },
  { field: "nextCutNumber", kind: "cut", label: "cortes de caja" },
  { field: "nextCountNumber", kind: "count", label: "conteos" },
];

export type LocalWithPalette = Local & { brandPalette: BrandPalette };

@singleton()
export class LocalService {
  constructor(private localDao: LocalDao) {}

  async getConfig(): Promise<Local> {
    return this.localDao.findOrCreate();
  }

  async getConfigWithPalette(): Promise<LocalWithPalette> {
    return this.withPalette(await this.getConfig());
  }

  async updateConfig(data: UpdateLocalDto): Promise<LocalWithPalette> {
    if (data.name !== undefined && !String(data.name).trim()) {
      throw new LocalValidationError("El nombre del local es obligatorio");
    }
    const { cashRoundingUnit, maxUnauthorizedCashVariance, taxRatePercent, ...rest } = data;
    const payload: Partial<Local> = {
      ...rest,
      ...(cashRoundingUnit !== undefined && { cashRoundingUnit: toMoney(cashRoundingUnit) }),
      ...(maxUnauthorizedCashVariance !== undefined && {
        maxUnauthorizedCashVariance: toMoney(maxUnauthorizedCashVariance),
      }),
      ...(taxRatePercent !== undefined && { taxRatePercent: toMoney(taxRatePercent) }),
    };
    if (payload.brandColor !== undefined)
      payload.brandColor = this.normalizeBrandColor(payload.brandColor);
    if (payload.timeZone !== undefined) payload.timeZone = this.validateTimeZone(payload.timeZone);
    if (payload.logo) payload.logo = await rasterizeLogoIfSvg(payload.logo);
    await this.assertFoliosAhead(data);

    const local = await this.localDao.findOrCreate();
    const updated = (await this.localDao.update(local.id, payload)) as Local;
    if (payload.name) await this.localDao.syncTenantName(String(payload.name).trim());
    return this.withPalette(updated);
  }

  async getLastUsedFolios(): Promise<Record<FolioKind, number>> {
    return this.localDao.lastUsedFolios();
  }

  // Un folio inicial igual o menor al ultimo asignado repetiria un folio existente.
  private async assertFoliosAhead(data: UpdateLocalDto): Promise<void> {
    const changed = FOLIO_FIELDS.filter(({ field }) => data[field] !== undefined);
    if (changed.length === 0) return;
    const lastUsed = await this.localDao.lastUsedFolios();
    for (const { field, kind, label } of changed) {
      const value = Number(data[field]);
      if (value <= lastUsed[kind]) {
        throw new LocalValidationError(
          `El siguiente folio de ${label} debe ser mayor a ${lastUsed[kind]}, el último ya asignado`,
        );
      }
    }
  }

  consumeFolio(kind: FolioKind, manager?: EntityManager): Promise<number> {
    return this.localDao.consume(kind, manager);
  }

  async consumeControlNumber(manager?: EntityManager): Promise<number> {
    return this.localDao.consume("control", manager);
  }

  async consumeSaleNumber(manager?: EntityManager): Promise<number> {
    return this.localDao.consume("sale", manager);
  }

  async consumeReturnNumber(manager?: EntityManager): Promise<number> {
    return this.localDao.consume("return", manager);
  }

  private validateTimeZone(value: unknown): string {
    try {
      if (typeof value !== "string" || !value) throw new Error();
      new Intl.DateTimeFormat("es-MX", { timeZone: value });
      return value;
    } catch {
      throw new LocalValidationError("La zona horaria no es válida");
    }
  }

  private normalizeBrandColor(value: unknown): string | null {
    if (value === null || value === "") return null;
    const normalized = typeof value === "string" ? value.toLowerCase() : "";
    if (!BRAND_COLOR_PATTERN.test(normalized)) {
      throw new LocalValidationError("El color de marca debe tener el formato #RRGGBB");
    }
    return normalized;
  }

  private withPalette(local: Local): LocalWithPalette {
    return Object.assign(local, { brandPalette: buildBrandPalette(local.brandColor) });
  }
}
