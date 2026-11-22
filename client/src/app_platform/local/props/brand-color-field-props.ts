import type { BrandPalette } from "../types/local";

export interface BrandColorFieldProps {
  value: string;
  palette: BrandPalette | null;
  disabled: boolean;
  onChange: (value: string) => void;
}
