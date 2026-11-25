import type { FC } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { InventoryItemSelect } from "@commerce/inventory/components/inventory-item-select";
import type { SaleCartLinesSectionProps } from "../props/sale-cart-lines-section-props";

export const SaleCartLinesSection: FC<SaleCartLinesSectionProps> = ({
  lines,
  branchId,
  onItemChange,
  onLineChange,
  onAddLine,
  onRemoveLine,
}) => (
  <div className="space-y-3">
    <Label className="text-gray-500">Productos</Label>
    {lines.map((line, index) => (
      <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <InventoryItemSelect
            value={line.inventoryItemId}
            onSelect={(item) => onItemChange(index, item)}
            branchId={branchId}
            blockOutOfStock
          />
        </div>
        <div className="w-full sm:w-24">
          <Input
            type="number"
            placeholder="Cantidad"
            aria-label="Cantidad"
            value={line.quantity}
            onChange={(e) => onLineChange(index, { quantity: e.target.value })}
          />
        </div>
        <div className="w-full sm:w-32">
          <Input
            type="number"
            placeholder="Precio"
            aria-label="Precio unitario"
            value={line.unitPrice}
            onChange={(e) => onLineChange(index, { unitPrice: e.target.value })}
          />
        </div>
        {lines.length > 1 && (
          <button
            type="button"
            onClick={() => onRemoveLine(index)}
            aria-label="Quitar producto"
            className="p-2.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    ))}
    <Button type="button" variant="outline" onClick={onAddLine}>
      <Plus className="mr-1.5 size-4" />
      Agregar producto
    </Button>
  </div>
);
