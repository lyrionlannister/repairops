import type { FC } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { InventoryItem } from "@commerce/inventory/hooks/use-inventory";
import type { RepairNoteItemLine } from "../hooks/use-repair-note-item-lines";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Select } from "@ui/select/select";
import { SectionTitle } from "./section-title";

interface RepairNoteItemLinesSectionProps {
  itemLines: RepairNoteItemLine[];
  inventoryItems: InventoryItem[];
  saving: boolean;
  onItemChange: (index: number, inventoryItemId: string) => void;
  onLineChange: (index: number, patch: Partial<RepairNoteItemLine>) => void;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
}

export const RepairNoteItemLinesSection: FC<RepairNoteItemLinesSectionProps> = ({
  itemLines,
  inventoryItems,
  saving,
  onItemChange,
  onLineChange,
  onAddLine,
  onRemoveLine,
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3 space-y-4">
    <SectionTitle>Productos usados</SectionTitle>
    <p className="text-xs text-gray-500 dark:text-gray-400">
      Accesorios o refacciones del inventario usados en esta reparación; se descuentan del stock solos.
    </p>
    <div className="space-y-3">
      {itemLines.map((line, index) => (
        <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Select
              value={line.inventoryItemId}
              onChange={(value) => onItemChange(index, value)}
              placeholder="Selecciona un producto"
              disabled={saving}
              options={inventoryItems.map((i) => ({
                value: i.id,
                // "Disponible", no quantityOnHand bruto -- resta lo ya
                // reservado en otras notas (Fase 5, Pieza 3) para no
                // prometer dos veces la misma refaccion.
                label: `${i.name} (disponible: ${i.available})`,
              }))}
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
