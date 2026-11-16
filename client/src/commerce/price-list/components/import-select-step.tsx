import type { FC } from "react";
import type { RefObject } from "react";
import { Upload, FileText, X } from "lucide-react";
import type { Supplier } from "@commerce/suppliers/hooks/use-suppliers";
import { Button } from "@ui/button/button";
import { Label } from "@ui/inputs/label";

interface ImportSelectStepProps {
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

export const ImportSelectStep: FC<ImportSelectStepProps> = ({
  suppliers,
  loadingSuppliers,
  supplierId,
  onSupplierIdChange,
  selectedFile,
  isDragging,
  fileInputRef,
  uploading,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInputChange,
  onClearFile,
  onCancel,
  onUpload,
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3 space-y-6">
    <div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Proveedor</p>
      <div className="max-w-sm">
        <Label className="text-gray-500">Proveedor</Label>
        <select
          value={supplierId}
          onChange={(e) => onSupplierIdChange(e.target.value)}
          disabled={loadingSuppliers}
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 disabled:opacity-50"
        >
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </div>

    <hr className="border-gray-100 dark:border-gray-800" />

    <div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Archivo (PDF o Excel)</p>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 cursor-pointer transition-colors ${
          isDragging
            ? "border-brand-400 bg-brand-50 dark:border-brand-500 dark:bg-brand-950/20"
            : "border-gray-300 hover:border-brand-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-brand-700 dark:hover:bg-white/2"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.xlsx,.xls"
          className="hidden"
          onChange={onFileInputChange}
        />
        {selectedFile ? (
          <>
            <FileText className="size-10 text-brand-500" />
            <div className="text-center">
              <p className="font-medium text-gray-800 dark:text-gray-200">{selectedFile.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearFile();
              }}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <X className="size-4" />
            </button>
          </>
        ) : (
          <>
            <Upload className="size-10 text-gray-400" />
            <div className="text-center">
              <p className="font-medium text-gray-600 dark:text-gray-300">
                Arrastra un archivo aquí o haz clic para seleccionar
              </p>
              <p className="text-sm text-gray-400 mt-1">Tamaño máximo: 20 MB</p>
            </div>
          </>
        )}
      </div>
    </div>

    <hr className="border-gray-100 dark:border-gray-800" />

    <div className="flex justify-end gap-3">
      <Button variant="outline" onClick={onCancel} disabled={uploading}>
        Cancelar
      </Button>
      <Button variant="primary" onClick={onUpload} disabled={!selectedFile || !supplierId || uploading}>
        <Upload className="mr-1.5 size-4" />
        {uploading ? "Enviando..." : "Procesar con IA"}
      </Button>
    </div>
  </div>
);
