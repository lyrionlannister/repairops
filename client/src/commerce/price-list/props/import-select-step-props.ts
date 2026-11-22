import type { RefObject } from "react";
import type { Supplier } from "@commerce/suppliers/types/suppliers";

export interface ImportSelectStepProps {
  suppliers: Supplier[];
  loadingSuppliers: boolean;
  supplierId: string;
  onSupplierIdChange: (value: string) => void;
  selectedFile: File | null;
  isDragging: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  uploading: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
  onCancel: () => void;
  onUpload: () => void;
}
