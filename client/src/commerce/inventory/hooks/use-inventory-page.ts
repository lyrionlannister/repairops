import { useEffect, useRef, useState } from "react";

import type { InventoryItem } from "./use-inventory";

export type InventoryMovementForm = {
  type: "in" | "out" | "adjustment";
  quantity: string;
  reason: string;
  createdByEmployeeId: string;
};

export const emptyMovementForm: InventoryMovementForm = {
  type: "in",
  quantity: "",
  reason: "",
  createdByEmployeeId: "",
};

export const useInventoryPage = ({
  items,
  branchId,
  fetchAll,
  remove,
  bulkImport,
  registerMovement,
  error,
  loading,
  saving,
}: {
  items: InventoryItem[];
  branchId: string;
  fetchAll: () => Promise<void>;
  remove: (id: string) => Promise<boolean>;
  bulkImport: (file: File, localId: string) => Promise<{ imported: number } | null>;
  registerMovement: (
    inventoryItemId: string,
    data: {
      type: "in" | "out" | "adjustment";
      quantity: number;
      reason?: string;
      createdByEmployeeId?: string;
    },
  ) => Promise<boolean>;
  error: string | null;
  loading: boolean;
  saving: boolean;
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null);
  const [movementForm, setMovementForm] = useState<InventoryMovementForm>(emptyMovementForm);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const notify = (message: string) => {
    setSuccessMsg(message);
    window.setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleDelete = async (id: string) => {
    const ok = await remove(id);
    if (ok) notify("Item eliminado.");
    setDeleteConfirmId(null);
  };

  const closeImport = () => {
    setIsImportOpen(false);
    setImportFile(null);
  };

  const handleImportSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!importFile || !branchId) return;

    const result = await bulkImport(importFile, branchId);
    if (result) {
      notify(`Importación completada: ${result.imported} items cargados.`);
      closeImport();
    }
  };

  const openMovement = (item: InventoryItem) => {
    setMovementItem(item);
    setMovementForm(emptyMovementForm);
  };

  const closeMovement = () => {
    setMovementItem(null);
    setMovementForm(emptyMovementForm);
  };

  const handleMovementSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!movementItem) return;

    const quantity = Number.parseInt(movementForm.quantity, 10);
    const signedQuantity = movementForm.type === "adjustment" ? quantity : Math.abs(quantity);
    const ok = await registerMovement(movementItem.id, {
      type: movementForm.type,
      quantity: signedQuantity,
      reason: movementForm.reason || undefined,
      createdByEmployeeId: movementForm.createdByEmployeeId || undefined,
    });

    if (ok) {
      notify("Movimiento registrado.");
      closeMovement();
    }
  };

  return {
    items,
    error,
    loading,
    saving,
    deleteConfirmId,
    setDeleteConfirmId,
    successMsg,
    isImportOpen,
    setIsImportOpen,
    importFile,
    setImportFile,
    importFileInputRef,
    movementItem,
    movementForm,
    setMovementForm,
    handleDelete,
    closeImport,
    handleImportSubmit,
    openMovement,
    closeMovement,
    handleMovementSubmit,
  };
};
