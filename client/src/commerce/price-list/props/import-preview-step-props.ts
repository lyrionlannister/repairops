import type { StagingRow } from "../types/import-staging";

export interface ImportPreviewStepProps {
  rows: StagingRow[];
  saving: boolean;
  onAddRow: () => void;
  onUpdateRow: (index: number, patch: Partial<StagingRow>) => void;
  onRemoveRow: (index: number) => void;
  onDiscard: () => void;
  onConfirm: () => void;
}
