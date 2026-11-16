import type { FC } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { StagingRow } from "../hooks/use-import-staging";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";

interface ImportPreviewStepProps {
  rows: StagingRow[];
  saving: boolean;
  onAddRow: () => void;
  onUpdateRow: (index: number, patch: Partial<StagingRow>) => void;
  onRemoveRow: (index: number) => void;
  onDiscard: () => void;
  onConfirm: () => void;
}

export const ImportPreviewStep: FC<ImportPreviewStepProps> = ({
  rows,
  saving,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
  onDiscard,
  onConfirm,
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        {rows.length} fila(s) detectadas. Revisa y corrige antes de confirmar.
      </p>
      <Button variant="outline" onClick={onAddRow}>
        <Plus className="mr-1.5 size-4" />
        Agregar fila
      </Button>
    </div>
    <div className="custom-scrollbar max-h-[calc(100vh-26rem)] min-h-60 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
          <tr>
            <th className="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Marca</th>
            <th className="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Modelo</th>
            <th className="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400 w-36">Precio</th>
            <th className="px-5 py-3 w-16" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((row, index) => (
            <tr key={index}>
              <td className="px-5 py-2">
                <Input value={row.brand} onChange={(e) => onUpdateRow(index, { brand: e.target.value })} />
              </td>
              <td className="px-5 py-2">
                <Input value={row.model} onChange={(e) => onUpdateRow(index, { model: e.target.value })} />
              </td>
              <td className="px-5 py-2">
                <Input
                  type="number"
                  value={String(row.price)}
                  onChange={(e) => onUpdateRow(index, { price: Number(e.target.value) || 0 })}
                />
              </td>
              <td className="px-5 py-2 text-right">
                <button
                  onClick={() => onRemoveRow(index)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="size-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
      <Button variant="outline" onClick={onDiscard} disabled={saving}>
        Descartar
      </Button>
      <Button variant="primary" onClick={onConfirm} disabled={saving || rows.length === 0}>
        {saving ? "Confirmando..." : "Confirmar importación"}
      </Button>
    </div>
  </div>
);
