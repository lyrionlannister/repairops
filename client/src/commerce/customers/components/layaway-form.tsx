import type { FC } from "react";
import { Plus } from "lucide-react";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { DatePicker } from "@ui/date-picker/date-picker";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";

import type { Customer } from "../hooks/use-customers";
import type { LayawayItemLine } from "../hooks/use-layaway-item-lines";
import type { LayawayMethod } from "../hooks/use-layaways";
import type { InventoryItem } from "@commerce/inventory/hooks/use-inventory";
import { METHOD_LABELS, formatMoney } from "../utils/format";

const FORM_CARD_CLASS = "space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3";

interface LayawayFormProps {
  hasContext: boolean;
  customers: Customer[];
  customerId: string;
  onCustomerIdChange: (value: string) => void;
  expiresAt: string;
  onExpiresAtChange: (value: string) => void;
  inventoryItems: InventoryItem[];
  lines: LayawayItemLine[];
  onUpdateLine: (index: number, patch: Partial<LayawayItemLine>) => void;
  onItemChange: (index: number, value: string) => void;
  onAddLine: () => void;
  depositAmount: string;
  onDepositAmountChange: (value: string) => void;
  depositMethod: LayawayMethod;
  onDepositMethodChange: (value: LayawayMethod) => void;
  totalValue: number;
  saving: boolean;
  hasCashSession: boolean;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export const LayawayForm: FC<LayawayFormProps> = ({
  hasContext,
  customers,
  customerId,
  onCustomerIdChange,
  expiresAt,
  onExpiresAtChange,
  inventoryItems,
  lines,
  onUpdateLine,
  onItemChange,
  onAddLine,
  depositAmount,
  onDepositAmountChange,
  depositMethod,
  onDepositMethodChange,
  totalValue,
  saving,
  hasCashSession,
  onSubmit,
  onCancel,
}) => (
  <form onSubmit={onSubmit} className={hasContext ? `${FORM_CARD_CLASS} lg:col-span-2` : FORM_CARD_CLASS}>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Label className="text-gray-500">Cliente</Label>
        <Select
          value={customerId}
          onChange={onCustomerIdChange}
          placeholder="Selecciona un cliente"
          options={customers.map((c) => ({ value: c.id, label: c.name }))}
        />
      </div>
      <div>
        <Label className="text-gray-500">Vence el</Label>
        <DatePicker value={expiresAt} onChange={onExpiresAtChange} />
      </div>
    </div>

    <div className="space-y-3">
      <Label className="text-gray-500">Items</Label>
      {lines.map((line, index) => (
        <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Select
              value={line.inventoryItemId}
              onChange={(value) => onItemChange(index, value)}
              placeholder="Selecciona un producto"
              options={inventoryItems.map((i) => ({ value: i.id, label: `${i.name} (disponible: ${i.available})` }))}
            />
          </div>
          <div className="w-full sm:w-24">
            <Input type="number" placeholder="Cant." value={line.quantity} onChange={(e) => onUpdateLine(index, { quantity: e.target.value })} />
          </div>
          <div className="w-full sm:w-32">
            <Input type="number" placeholder="Precio" value={line.unitPrice} onChange={(e) => onUpdateLine(index, { unitPrice: e.target.value })} />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={onAddLine}>
        <Plus className="mr-1.5 size-4" />
        Agregar producto
      </Button>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Label className="text-gray-500">Anticipo</Label>
        <Input type="number" value={depositAmount} onChange={(e) => onDepositAmountChange(e.target.value)} />
      </div>
      <div>
        <Label className="text-gray-500">Método del anticipo</Label>
        <Select
          value={depositMethod}
          onChange={(value) => onDepositMethodChange(value as LayawayMethod)}
          options={Object.entries(METHOD_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </div>
    </div>

    <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
      <span className="text-sm text-gray-500 dark:text-gray-400">Valor total</span>
      <span className="text-xl font-semibold text-gray-800 dark:text-white/90">{formatMoney(totalValue)}</span>
    </div>

    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
        Cancelar
      </Button>
      <Button type="submit" variant="primary" disabled={saving || !hasCashSession}>
        {saving ? "Guardando..." : "Abrir apartado"}
      </Button>
    </div>
  </form>
);
