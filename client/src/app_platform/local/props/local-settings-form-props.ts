import type { RefObject } from "react";
import type { LocalRecord } from "../types/local";
import type { LocalFormState, AttributionBasis } from "../types/local-page";

export interface LocalSettingsFormProps {
  local: LocalRecord | null;
  form: LocalFormState;
  saving: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  attributionBasis: AttributionBasis;
  attributionSaving: boolean;
  attributionMessage: string | null;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  onLogoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAttributionBasisChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onRemoveLogo: () => void;
  onSetBrandColor: (color: string) => void;
}
