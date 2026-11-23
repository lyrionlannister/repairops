import type { LocalFieldChange, LocalFormState } from "../types/local-page";

export interface LocalOperationSectionProps {
  form: LocalFormState;
  saving: boolean;
  onChange: LocalFieldChange;
  onSetField: (name: keyof LocalFormState, value: string) => void;
}
