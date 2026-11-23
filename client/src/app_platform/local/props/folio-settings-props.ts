import type { FolioField } from "../types/local";

export interface FolioSettingsProps {
  values: Record<FolioField, string>;
  saving: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}
