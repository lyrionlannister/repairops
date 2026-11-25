import type { FC } from "react";
import { ArrowRightLeft } from "lucide-react";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { InventoryItemSelect } from "./inventory-item-select";
import type { InventoryTransferFormProps } from "../props/inventory-transfer-form-props";

export const InventoryTransferForm: FC<InventoryTransferFormProps> = ({
  itemLabel,
  fromItem,
  onFromItemChange,
  toItem,
  onToItemChange,
  sameItem,
  sameBranch,
  exceedsStock,
  quantity,
  onQuantityChange,
  reason,
  onReasonChange,
  creating,
  disabled,
  onSubmit,
}) => (
  <form
    onSubmit={onSubmit}
    className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3"
  >
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Label className="text-gray-500">Producto de origen</Label>
        <InventoryItemSelect
          value={fromItem?.id ?? ""}
          onSelect={onFromItemChange}
          getLabel={itemLabel}
          placeholder="Busca el producto que sale"
          ariaLabel="Producto de origen"
        />
      </div>
      <div>
        <Label className="text-gray-500">Producto de destino</Label>
        <InventoryItemSelect
          value={toItem?.id ?? ""}
          onSelect={onToItemChange}
          getLabel={itemLabel}
          placeholder="Busca el mismo producto en la otra sucursal"
          ariaLabel="Producto de destino"
        />
      </div>
    </div>
    {sameItem && <p className="text-sm text-red-500">Elige productos distintos en origen y destino.</p>}
    {sameBranch && (
      <p className="text-sm text-red-500">
        Los dos productos están en la misma sucursal. Elige el destino en otra sucursal.
      </p>
    )}
    {exceedsStock && fromItem && (
      <p className="text-sm text-red-500">
        Solo hay {fromItem.quantityOnHand} en existencia de {fromItem.name}.
      </p>
    )}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Label className="text-gray-500">Cantidad</Label>
        <Input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
        />
      </div>
      <div>
        <Label className="text-gray-500">Motivo (opcional)</Label>
        <Input
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Ej. reabasto de sucursal"
        />
      </div>
    </div>
    <Button type="submit" variant="primary" className="w-full" disabled={disabled}>
      <ArrowRightLeft className="mr-1.5 size-4" />
      {creating ? "Transfiriendo..." : "Transferir"}
    </Button>
  </form>
);
