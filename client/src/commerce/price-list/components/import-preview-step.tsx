import type { FC } from "react";
import { Plus, Trash2, Search, Sparkles } from "lucide-react";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { TablePaginationFooter } from "@ui/table/table-pagination-footer";
import { useImportPreview } from "../hooks/use-import-preview";
import type { ImportPreviewStepProps } from "../props/import-preview-step-props";

export const ImportPreviewStep: FC<ImportPreviewStepProps> = ({
  rows,
  saving,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
  onDiscard,
  onConfirm,
}) => {
  const {
    search,
    setSearch,
    activeBrand,
    setActiveBrand,
    brands,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    startIndex,
    pageItems,
  } = useImportPreview(rows);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Sparkles className="size-4 shrink-0 text-brand-500" />
            <span>{rows.length} producto(s) detectados. Revisa y corrige antes de confirmar.</span>
          </div>
          <Button variant="outline" onClick={onAddRow} className="shrink-0">
            <Plus className="mr-1.5 size-4" />
            Agregar fila
          </Button>
        </div>

        <div className="relative mt-3 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar marca o modelo..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>

        {brands.length > 2 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => setActiveBrand(brand)}
                className={`rounded-full px-3 py-3 text-xs md:py-1 font-medium transition-colors ${
                  activeBrand === brand
                    ? "bg-brand-600 text-white dark:bg-brand-500"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/3">
        {pageItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-10 text-center text-sm text-gray-500 dark:text-gray-400">
            <Search className="size-8 text-gray-300 dark:text-gray-600" />
            Sin resultados para esa búsqueda o marca.
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {pageItems.map(({ row, index }) => (
              <div
                key={index}
                className="flex flex-col gap-2 rounded-xl border border-gray-100 p-3 dark:border-gray-800/70 sm:flex-row sm:items-center"
              >
                <div className="w-full sm:w-36">
                  <Input
                    value={row.brand}
                    onChange={(e) => onUpdateRow(index, { brand: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={row.model}
                    onChange={(e) => onUpdateRow(index, { model: e.target.value })}
                  />
                </div>
                <div className="w-full sm:w-32">
                  <Input
                    type="number"
                    value={String(row.price)}
                    onChange={(e) => onUpdateRow(index, { price: Number(e.target.value) || 0 })}
                  />
                </div>
                <button
                  onClick={() => onRemoveRow(index)}
                  className="self-end rounded-lg p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-500 sm:self-auto dark:hover:bg-red-950/30"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {totalItems > 0 && (
          <TablePaginationFooter
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            totalItems={totalItems}
            startIndex={startIndex}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onDiscard} disabled={saving}>
          Descartar
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={saving || rows.length === 0}>
          {saving ? "Confirmando..." : "Confirmar importación"}
        </Button>
      </div>
    </div>
  );
};
