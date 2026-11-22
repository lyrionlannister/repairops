export interface BrandPalette {
  base: string;
  dark: string;
  mid: string;
  footer: string;
  light: string;
  border: string;
  onBrand: string;
}

export interface LocalRecord {
  id: string;
  name?: string;
  address?: string;
  phone?: string;
  logo?: string;
  nextControlNumber: number;
  cashRoundingUnit: number;
  currency: string;
  defaultTicketSize: TicketSize;
  warrantyClause?: string | null;
  brandColor?: string | null;
  timeZone: string;
  brandPalette: BrandPalette;
  taxRatePercent: number;
  maxDiscountPercentByRole: Record<string, number>;
  updatedAt: string;
}

export type TicketSize = "58mm" | "80mm" | "letter";
