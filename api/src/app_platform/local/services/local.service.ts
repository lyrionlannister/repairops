import { singleton } from "tsyringe";
import { LocalDao } from "../daos/local.dao.js";
import { Local } from "../entities/local.entity.js";
import { rasterizeLogoIfSvg } from "../../../core/common/utils/rasterize-logo.js";
import { buildBrandPalette, BRAND_COLOR_PATTERN, type BrandPalette } from "../utils/brand-palette.js";

export class LocalValidationError extends Error {}

export type LocalWithPalette = Local & { brandPalette: BrandPalette };

@singleton()
export class LocalService {
  constructor(private localDao: LocalDao) {}

  async getConfig(): Promise<Local> {
    return this.localDao.findOrCreate();
  }

  // Lo que ve el cliente: la configuracion mas la paleta ya derivada.
  async getConfigWithPalette(): Promise<LocalWithPalette> {
    return this.withPalette(await this.getConfig());
  }

  async updateConfig(data: Partial<Local>): Promise<LocalWithPalette> {
    if (data.name !== undefined && !String(data.name).trim()) {
      throw new LocalValidationError("El nombre del local es obligatorio");
    }
    const payload: Partial<Local> = { ...data };
    if (payload.brandColor !== undefined) payload.brandColor = this.normalizeBrandColor(payload.brandColor);
    if (payload.timeZone !== undefined) payload.timeZone = this.validateTimeZone(payload.timeZone);
    if (payload.logo) payload.logo = await rasterizeLogoIfSvg(payload.logo);

    const local = await this.localDao.findOrCreate();
    const updated = (await this.localDao.update(local.id, payload)) as Local;
    return this.withPalette(updated);
  }

  async consumeControlNumber(): Promise<number> {
    return this.localDao.consumeControlNumber();
  }

  async consumeSaleNumber(): Promise<number> {
    return this.localDao.consumeSaleNumber();
  }

  async consumeReturnNumber(): Promise<number> {
    return this.localDao.consumeReturnNumber();
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
