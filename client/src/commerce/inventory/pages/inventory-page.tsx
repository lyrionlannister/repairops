import { Plus, Search, Upload } from "lucide-react";

import { useNavigate } from "react-router";
import { useBranch } from "@common/hooks/use-branch";
import { useInventory } from "../hooks/use-inventory";
import { useInventoryPage } from "../hooks/use-inventory-page";
import { CheckboxField } from "@ui/checkbox/checkbox-field";
import { useSupplierName } from "../hooks/use-supplier-name";
import { usePermissions } from "@common/hooks/use-permissions";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { ConfirmModal } from "@ui/modal/confirm-modal";
import { PageShell } from "@common/components/page-shell/page-shell";
import { InventoryTable } from "../components/inventory-table";
import { InventoryMovementModal } from "../components/inventory-movement-modal";
import { InventoryImportModal } from "../components/inventory-import-modal";
import { inventoryDescription } from "../utils/stock";

export const InventoryPage = () => {
  const { workingBranchId } = useBranch();
  const { saving, remove, bulkImport, registerMovement } = useInventory();
  const supplierName = useSupplierName();
  const { can } = usePermissions();
  const canManage = can("inventory.manage");
  const navigate = useNavigate();

  const {
    list,
    search,
    setSearch,
    criticalOnly,
    setCriticalOnly,
    hasFilters,
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
  } = useInventoryPage({ branchId: workingBranchId, remove, bulkImport, registerMovement });

  return (
    <PageShell
      title="Inventario"
      description={inventoryDescription(list.total, hasFilters, list.loading)}
      action={
        canManage && (
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
        )
      }
    >
      <div className="shrink-0 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              name="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o SKU"
              className="pl-9"
            />
          </div>
          <CheckboxField
            label="Solo stock crítico"
            checked={criticalOnly}
            onChange={setCriticalOnly}
          />
        </div>
      </div>

      <InventoryTable
        error={list.items.length === 0 ? list.error : null}
        onRetry={() => void list.refetch()}
        loading={list.loading}
        hasFilters={hasFilters}
        pageItems={list.items}
        supplierName={supplierName}
        page={list.page}
        pageSize={list.pageSize}
        totalPages={list.totalPages}
        totalItems={list.total}
        startIndex={list.startIndex}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        onOpenMovement={openMovement}
        onRequestDelete={setDeleteConfirmId}
        showCosts={can("inventory.read")}
        canManage={canManage}
        canAdjust={can("inventory.adjust")}
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
