import type { Local } from "../../../app_platform/local/entities/local.entity.js";
import { buildBrandPalette, type BrandPalette } from "../../../app_platform/local/utils/brand-palette.js";

export interface PdfLocal {
  name: string | null;
  address: string | null;
  phone: string | null;
  logo: string | null;
  warrantyClause: string | null;
}

export function toPdfLocal(local: Local | null): PdfLocal {
  return {
    name: local?.name ?? null,
    address: local?.address ?? null,
    phone: local?.phone ?? null,
    logo: local?.logo ?? null,
    warrantyClause: local?.warrantyClause ?? null,
  };
}

export const paletteOf = (local: Local | null): BrandPalette => buildBrandPalette(local?.brandColor);
