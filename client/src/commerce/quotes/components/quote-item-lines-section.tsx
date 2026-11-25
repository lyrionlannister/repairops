import type { FC } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { InventoryItemSelect } from "@commerce/inventory/components/inventory-item-select";
import type { QuoteItemLinesSectionProps } from "../props/quote-item-lines-section-props";

export const QuoteItemLinesSection: FC<QuoteItemLinesSectionProps> = ({
  itemLines,
  branchId,
  saving,
  onInventoryItemChange,
  onLineChange,
  onAddLine,
  onRemoveLine,
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3 space-y-4">
    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Productos cotizados</p>
    <p className="text-xs text-gray-500 dark:text-gray-400">
      Selecciona un producto del inventario para autocompletar, o escribe una descripción libre (mano de obra, servicio, etc.).
    </p>
    <div className="space-y-3">
      {itemLines.map((line, index) => (
        <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="w-full sm:w-56">
            <InventoryItemSelect
              value={line.inventoryItemId}
              onSelect={(item) => onInventoryItemChange(index, item)}
              branchId={branchId}
              placeholder="Producto de inventario (opcional)"
              disabled={saving}
            />
          </div>
          <div className="flex-1">
            <Input
              placeholder="Descripción"
              value={line.description}
              onChange={(e) => onLineChange(index, { description: e.target.value })}
              disabled={saving}
            />
          </div>
          <div className="w-full sm:w-24">
            <Input
              type="number"
              placeholder="Cant."
              value={line.quantity}
              onChange={(e) => onLineChange(index, { quantity: e.target.value })}
              disabled={saving}
            />
          </div>
          <div className="w-full sm:w-32">
            <Input
              type="number"
              placeholder="Precio"
              value={line.unitPrice}
              onChange={(e) => onLineChange(index, { unitPrice: e.target.value })}
              disabled={saving}
            />
          </div>
          <button
            type="button"
            onClick={() => onRemoveLine(index)}
            disabled={saving}
            className="p-2.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={onAddLine} disabled={saving}>
        <Plus className="mr-1.5 size-4" />
        Agregar producto
      </Button>
    </div>
  </div>
);
