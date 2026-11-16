import { Boxes, Plus, Pencil, Trash2, ArrowUpDown, Upload, FileSpreadsheet } from "lucide-react";

import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useBranch } from "@common/hooks/use-branch";
import usePaginatedList from "@common/hooks/use-paginated-list";
import { useInventory } from "../hooks/use-inventory";
import { useInventoryPage } from "../hooks/use-inventory-page";
import { useSuppliers } from "@commerce/suppliers/hooks/use-suppliers";
import { EmployeeSelect } from "@common/components/employee-select";
import { Alert } from "@ui/alert/alert";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";
import { Modal } from "@ui/modal/modal";
import { ConfirmModal } from "@ui/modal/confirm-modal";
import { Pagination } from "@ui/table/pagination";
import { ScrollTable } from "@ui/table/scroll-table";
import { PageShell } from "@common/components/page-shell/page-shell";

const KIND_LABELS: Record<"accessory" | "part", string> = {
  accessory: "Accesorio",
  part: "Parte",
};

const formatMoney = (value: number) => `$${Number(value).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

export const InventoryPage = () => {
  const { items: allItems, loading, saving, error, fetchAll, remove, bulkImport, registerMovement } = useInventory();
  const { activeBranchId } = useBranch();
  const { suppliers, fetchAll: fetchSuppliers } = useSuppliers();
  const navigate = useNavigate();
  const items = useMemo(
    () => (activeBranchId ? allItems.filter((item) => item.localId === activeBranchId) : allItems),
    [allItems, activeBranchId],
  );
  const supplierName = (supplierId: string | null) => suppliers.find((s) => s.id === supplierId)?.name ?? "—";

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const {
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
  } = useInventoryPage({
    items,
    branchId: activeBranchId,
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
      description={items.length > 0 ? `${items.length} items en total.` : "Sin items cargados."}
      action={
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-1.5 size-4" />
            Importar CSV/Excel
          </Button>
          <Button variant="primary" onClick={() => navigate("/admin/inventory/new")}>
            <Plus className="mr-1.5 size-4" />
            Nuevo item
          </Button>
        </div>
      }
    >
      {error && <Alert variant="error" title="Error" message={error} />}
      {successMsg && <Alert variant="success" title="Listo" message={successMsg} />}

      <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando inventario...</div>
        ) : pageItems.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center text-gray-400">
            <Boxes className="size-10 opacity-40" />
            <p className="text-sm">No hay items. Agrega el primero.</p>
          </div>
        ) : (
          <ScrollTable
            className="min-w-225"
            colgroup={
              <colgroup>
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col className="w-36" />
              </colgroup>
            }
            header={
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Nombre</th>
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">SKU</th>
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Tipo</th>
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Proveedor</th>
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Costo</th>
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Venta</th>
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Stock</th>
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            }
          >
            <tbody>
              {pageItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-white/2"
                >
                  <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">{item.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{item.sku ?? "—"}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{KIND_LABELS[item.kind]}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{supplierName(item.supplierId)}</td>
                  <td className="px-4 py-4 text-right text-sm text-gray-700 dark:text-gray-300 tabular-nums">{formatMoney(item.costPrice)}</td>
                  <td className="px-4 py-4 text-right text-sm text-gray-700 dark:text-gray-300 tabular-nums">{formatMoney(item.salePrice)}</td>
                  <td className="px-4 py-4 text-right text-sm tabular-nums">
                    <span className={item.quantityOnHand <= 0 ? "text-error-500 font-medium" : "text-gray-700 dark:text-gray-300"}>
                      {item.quantityOnHand}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openMovement(item)} title="Registrar movimiento" className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30">
                        <ArrowUpDown className="size-4" />
                      </button>
                      <button onClick={() => navigate(`/admin/inventory/${item.id}/edit`)} className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30">
                        <Pencil className="size-4" />
                      </button>
                      <button onClick={() => setDeleteConfirmId(item.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </ScrollTable>
        )}

        {!loading && totalItems > 0 && (
          <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Mostrar</span>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                {[10, 25, 50].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span>
                Mostrando {startIndex + 1}–{Math.min(startIndex + pageSize, totalItems)} de {totalItems}
              </span>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal isOpen={movementItem !== null} onClose={closeMovement} className="max-w-md p-6 sm:p-8 mx-4">
        <h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-gray-100">Registrar movimiento</h2>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">{movementItem?.name}</p>
        <form onSubmit={handleMovementSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-500">Tipo</Label>
              <Select
                value={movementForm.type}
                onChange={(value) => setMovementForm((prev) => ({ ...prev, type: value as typeof movementForm.type }))}
                disabled={saving}
                options={[
                  { value: "in", label: "Entrada" },
                  { value: "out", label: "Salida" },
                  { value: "adjustment", label: "Ajuste (+/-)" },
                ]}
              />
            </div>
            <div>
              <Label className="text-gray-500">Cantidad</Label>
              <Input type="number" placeholder="Ej. 5" value={movementForm.quantity} onChange={(event) => setMovementForm((prev) => ({ ...prev, quantity: event.target.value }))} required disabled={saving} />
            </div>
          </div>
          <div>
            <Label className="text-gray-500">Motivo</Label>
            <Input placeholder="Opcional" value={movementForm.reason} onChange={(event) => setMovementForm((prev) => ({ ...prev, reason: event.target.value }))} disabled={saving} />
          </div>
          <div>
            <Label className="text-gray-500">Empleado</Label>
            <EmployeeSelect value={movementForm.createdByEmployeeId} onChange={(employeeId) => setMovementForm((prev) => ({ ...prev, createdByEmployeeId: employeeId }))} disabled={saving} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={closeMovement} disabled={saving}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? "Guardando..." : "Registrar"}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isImportOpen} onClose={closeImport} className="max-w-md p-6 sm:p-8 mx-4">
        <h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-gray-100">Importar inventario</h2>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Columnas esperadas: nombre, sku (opcional), tipo (accesorio/refacción), precio costo, precio venta, cantidad (opcional).
        </p>
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <div onClick={() => importFileInputRef.current?.click()} className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 p-8 hover:border-brand-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-brand-700 dark:hover:bg-white/2">
            <input
              ref={importFileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setImportFile(file);
                event.target.value = "";
              }}
            />
            <FileSpreadsheet className="size-8 text-gray-400" />
            <p className="text-center text-sm text-gray-600 dark:text-gray-300">{importFile ? importFile.name : "Haz clic para seleccionar un CSV o Excel"}</p>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={closeImport} disabled={saving}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={saving || !importFile}>{saving ? "Importando..." : "Importar"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        title="Eliminar item"
        message="¿Eliminar este item de inventario? Esta acción no se puede deshacer."
        danger
        loading={saving}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
      />
    </PageShell>
  );
};

