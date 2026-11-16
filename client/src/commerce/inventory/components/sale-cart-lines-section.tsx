import type { FC } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { InventoryItem } from "../hooks/use-inventory";
import type { SaleLineItem } from "../hooks/use-sale-cart";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";

interface SaleCartLinesSectionProps {
  lines: SaleLineItem[];
  inventoryItems: InventoryItem[];
  onItemChange: (index: number, inventoryItemId: string) => void;
  onLineChange: (index: number, patch: Partial<SaleLineItem>) => void;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
}

export const SaleCartLinesSection: FC<SaleCartLinesSectionProps> = ({
  lines,
  inventoryItems,
  onItemChange,
  onLineChange,
  onAddLine,
  onRemoveLine,
}) => (
  <div className="space-y-3">
    <Label className="text-gray-500">Items</Label>
    {lines.map((line, index) => (
      <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Select
            value={line.inventoryItemId}
            onChange={(value) => onItemChange(index, value)}
            placeholder="Selecciona un item"
            options={inventoryItems.map((i) => ({
              value: i.id,
              label: `${i.name} (stock: ${i.quantityOnHand})`,
            }))}
          />
        </div>
        <div className="w-full sm:w-24">
          <Input
            type="number"
            placeholder="Cant."
            value={line.quantity}
            onChange={(e) => onLineChange(index, { quantity: e.target.value })}
          />
        </div>
        <div className="w-full sm:w-32">
          <Input
            type="number"
            placeholder="Precio"
            value={line.unitPrice}
            onChange={(e) => onLineChange(index, { unitPrice: e.target.value })}
          />
        </div>
        {lines.length > 1 && (
          <button
            type="button"
            onClick={() => onRemoveLine(index)}
            className="p-2.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    ))}
    <Button type="button" variant="outline" onClick={onAddLine}>
      <Plus className="mr-1.5 size-4" />
      Agregar item
    </Button>
  </div>
);
