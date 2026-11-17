import { Plus, Upload } from "lucide-react";

import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useBranch } from "@common/hooks/use-branch";
import { usePaginatedList } from "@common/hooks/use-paginated-list";
import { useBranchScopedInventory } from "../hooks/use-branch-scoped-inventory";
import { useInventoryPage } from "../hooks/use-inventory-page";
import { useSuppliers } from "@commerce/suppliers/hooks/use-suppliers";
import { Button } from "@ui/button/button";
import { ConfirmModal } from "@ui/modal/confirm-modal";
import { PageShell } from "@common/components/page-shell/page-shell";
import { InventoryTable } from "../components/inventory-table";
import { InventoryMovementModal } from "../components/inventory-movement-modal";
import { InventoryImportModal } from "../components/inventory-import-modal";

export const InventoryPage = () => {
  const { workingBranchId } = useBranch();
  const { items, loading, saving, error, fetchAll, remove, bulkImport, registerMovement } =
    useBranchScopedInventory(workingBranchId);
  const { suppliers, fetchAll: fetchSuppliers } = useSuppliers();
  const navigate = useNavigate();
  const supplierName = (supplierId: string | null) => suppliers.find((s) => s.id === supplierId)?.name ?? "—";

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const {
    deleteConfirmId,
    setDeleteConfirmId,
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
  } = useInventoryPage({
    items,
    branchId: workingBranchId,
    fetchAll,
    remove,
    bulkImport,
    registerMovement,
    error,
    loading,
    saving,
  });

  const { page, setPage, pageSize, setPageSize, totalPages, totalItems, startIndex, pageItems } =
    usePaginatedList(items);

  return (
    <PageShell
      title="Inventario"
      description={items.length > 0 ? `${items.length} productos en total.` : "Aún no hay productos."}
      action={
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-1.5 size-4" />
            Importar CSV/Excel
          </Button>
          <Button variant="primary" onClick={() => navigate("/commerce/inventory/new")}>
            <Plus className="mr-1.5 size-4" />
            Nuevo producto
          </Button>
        </div>
      }
    >

      <InventoryTable
        loading={loading}
        pageItems={pageItems}
        supplierName={supplierName}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        totalItems={totalItems}
        startIndex={startIndex}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onOpenMovement={openMovement}
        onRequestDelete={setDeleteConfirmId}
      />

      <InventoryMovementModal
        movementItem={movementItem}
        movementForm={movementForm}
        saving={saving}
        onClose={closeMovement}
        onFormChange={setMovementForm}
        onSubmit={handleMovementSubmit}
      />

      <InventoryImportModal
        isOpen={isImportOpen}
        importFile={importFile}
        importFileInputRef={importFileInputRef}
        saving={saving}
        onClose={closeImport}
        onFileSelected={setImportFile}
        onSubmit={handleImportSubmit}
      />

      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        title="Eliminar producto"
        message="¿Eliminar este producto del inventario? Esta acción no se puede deshacer."
        danger
        loading={saving}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
      />
    </PageShell>
  );
};
