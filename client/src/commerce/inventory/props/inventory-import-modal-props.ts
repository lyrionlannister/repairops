import type { RefObject } from "react";

export interface InventoryImportModalProps {
  isOpen: boolean;
  importFile: File | null;
  importFileInputRef: RefObject<HTMLInputElement | null>;
  saving: boolean;
  onClose: () => void;
  onFileSelected: (file: File) => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
}
