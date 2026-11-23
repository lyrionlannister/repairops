import type { RefObject } from "react";
import type { BrandPalette } from "../types/local";
import type { LocalFieldChange, LocalFormState } from "../types/local-page";

export interface LocalIdentitySectionProps {
  form: LocalFormState;
  palette: BrandPalette | null;
  saving: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onChange: LocalFieldChange;
  onLogoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
  onSetBrandColor: (color: string) => void;
}
