import type { RefObject } from "react";
import type { LocalRecord } from "../types/local";
import type {
  AttributionBasis,
  LocalFieldChange,
  LocalFormState,
  LocalTabKey,
} from "../types/local-page";

export interface LocalSettingsFormProps {
  local: LocalRecord | null;
  form: LocalFormState;
  saving: boolean;
  isDirty: boolean;
  activeTab: LocalTabKey;
  dirtyTabs: ReadonlySet<LocalTabKey>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  attributionBasis: AttributionBasis;
  attributionSaving: boolean;
  attributionMessage: string | null;
  onSelectTab: (tab: LocalTabKey) => void;
  cashBranchId: string | null;
  onViewCashBranch: (branchId: string | null) => void;
  onChange: LocalFieldChange;
  onSetField: (name: keyof LocalFormState, value: string) => void;
  onLogoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAttributionBasisChange: (value: AttributionBasis) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onDiscard: () => void;
  onRemoveLogo: () => void;
  onSetBrandColor: (color: string) => void;
}
