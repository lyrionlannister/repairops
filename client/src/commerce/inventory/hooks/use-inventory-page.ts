import { useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useServerList } from "@common/hooks/use-server-list";
import type { InventoryItem } from "../types/inventory";
import type { InventoryMovementForm } from "../types/inventory-page";

export const emptyMovementForm: InventoryMovementForm = {
  type: "in",
  quantity: "",
  reason: "",
  createdByEmployeeId: "",
};

export const useInventoryPage = ({
  branchId,
  remove,
  bulkImport,
  registerMovement,
}: {
  branchId: string;
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
}) => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [criticalOnly, setCriticalOnly] = useState(() => searchParams.get("stock") === "critical");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null);
  const [movementForm, setMovementForm] = useState<InventoryMovementForm>(emptyMovementForm);

  // Solo productos de la sucursal activa: vender o ajustar de otra sucursal afectaria
  // stock que esta pantalla no muestra.
  const list = useServerList<InventoryItem>("/inventory", {
    search,
    filters: { branchId: branchId || undefined, stock: criticalOnly ? "critical" : undefined },
    errorText: "No pudimos cargar el inventario.",
  });

  const notify = (message: string) => {
    setSuccessMsg(message);
    window.setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleDelete = async (id: string) => {
    const ok = await remove(id);
    setDeleteConfirmId(null);
    if (ok) {
      notify("Producto eliminado.");
      await list.refetch();
    }
  };

  const closeImport = () => {
    setIsImportOpen(false);
    setImportFile(null);
  };

  const handleImportSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!importFile || !branchId) return;

    const result = await bulkImport(importFile, branchId);
    if (result) {
      notify(`Importación completada: ${result.imported} productos cargados.`);
      closeImport();
      await list.refetch();
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

  const handleMovementSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
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
      await list.refetch();
    }
  };

  return {
    list,
    search,
    setSearch,
    criticalOnly,
    setCriticalOnly,
    hasFilters: list.hasSearch || criticalOnly,
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
