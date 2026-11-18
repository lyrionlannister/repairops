import type { FC } from "react";
import { ArrowRightLeft } from "lucide-react";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";

import type { InventoryItem } from "../hooks/use-inventory";

interface InventoryTransferFormProps {
  items: InventoryItem[];
  itemLabel: (item: InventoryItem) => string;
  fromItemId: string;
  onFromItemIdChange: (value: string) => void;
  toItemId: string;
  onToItemIdChange: (value: string) => void;
  sameBranch: boolean;
  quantity: string;
  onQuantityChange: (value: string) => void;
  reason: string;
  onReasonChange: (value: string) => void;
  creating: boolean;
  disabled: boolean;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
}

export const InventoryTransferForm: FC<InventoryTransferFormProps> = ({
  items,
  itemLabel,
  fromItemId,
  onFromItemIdChange,
  toItemId,
  onToItemIdChange,
  sameBranch,
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
        <Label className="text-gray-500">Item origen</Label>
        <Select
          value={fromItemId}
          onChange={onFromItemIdChange}
          placeholder="Selecciona el producto de origen"
          options={items.map((i) => ({ value: i.id, label: itemLabel(i) }))}
        />
      </div>
      <div>
        <Label className="text-gray-500">Item destino</Label>
        <Select
          value={toItemId}
          onChange={onToItemIdChange}
          placeholder="Selecciona el producto de destino"
          options={items.filter((i) => i.id !== fromItemId).map((i) => ({ value: i.id, label: itemLabel(i) }))}
        />
      </div>
    </div>
    {sameBranch && (
      <p className="text-sm text-red-500">El item origen y destino pertenecen a la misma sucursal.</p>
    )}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Label className="text-gray-500">Cantidad</Label>
        <Input type="number" value={quantity} onChange={(e) => onQuantityChange(e.target.value)} />
      </div>
      <div>
        <Label className="text-gray-500">Motivo (opcional)</Label>
        <Input value={reason} onChange={(e) => onReasonChange(e.target.value)} placeholder="Opcional" />
      </div>
    </div>
    <Button type="submit" variant="primary" className="w-full" disabled={disabled}>
      <ArrowRightLeft className="mr-1.5 size-4" />
      {creating ? "Transfiriendo..." : "Transferir"}
    </Button>
  </form>
);
