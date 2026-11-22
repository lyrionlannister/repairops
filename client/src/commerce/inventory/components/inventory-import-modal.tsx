import type { FC } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Modal } from "@ui/modal/modal";
import { Button } from "@ui/button/button";
import type { InventoryImportModalProps } from "../props/inventory-import-modal-props";

export const InventoryImportModal: FC<InventoryImportModalProps> = ({
  isOpen,
  importFile,
  importFileInputRef,
  saving,
  onClose,
  onFileSelected,
  onSubmit,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6 sm:p-8 mx-4">
    <h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-gray-100">
      Importar inventario
    </h2>
    <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
      Columnas esperadas: nombre, sku (opcional), tipo (accesorio/refacción), precio costo, precio
      venta, cantidad (opcional).
    </p>
    <form onSubmit={onSubmit} className="space-y-4">
      <div
        onClick={() => importFileInputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 p-8 hover:border-brand-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-brand-700 dark:hover:bg-white/2"
      >
        <input
          ref={importFileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFileSelected(file);
            event.target.value = "";
          }}
        />
        <FileSpreadsheet className="size-8 text-gray-400" />
        <p className="text-center text-sm text-gray-600 dark:text-gray-300">
          {importFile ? importFile.name : "Haz clic para seleccionar un CSV o Excel"}
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={saving || !importFile}>
          {saving ? "Importando..." : "Importar"}
        </Button>
      </div>
    </form>
  </Modal>
);
