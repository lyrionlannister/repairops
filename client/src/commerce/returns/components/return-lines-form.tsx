import type { FC } from "react";
import { RotateCcw } from "lucide-react";
import type { SaleWithItems, RefundMethod } from "../hooks/use-returns";
import type { LineDraft } from "../hooks/use-return-refund";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";
import { PAYMENT_LABELS, formatMoney } from "../utils/format";

interface ReturnLinesFormProps {
  sale: SaleWithItems;
  lines: LineDraft[];
  alreadyReturned: Record<string, number>;
  itemNames: Record<string, string>;
  refundMethod: RefundMethod;
  reason: string;
  totalRefunded: number;
  saving: boolean;
  canSubmit: boolean;
  onLineChange: (saleItemId: string, patch: Partial<LineDraft>) => void;
  onRefundMethodChange: (method: RefundMethod) => void;
  onReasonChange: (value: string) => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
}

export const ReturnLinesForm: FC<ReturnLinesFormProps> = ({
  sale,
  lines,
  alreadyReturned,
  itemNames,
  refundMethod,
  reason,
  totalRefunded,
  saving,
  canSubmit,
  onLineChange,
  onRefundMethodChange,
  onReasonChange,
  onSubmit,
}) => (
  <form
    onSubmit={onSubmit}
    className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3"
  >
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-medium text-gray-800 dark:text-white/90">Venta #{sale.saleNumber}</h2>
      <span className="text-sm text-gray-500 dark:text-gray-400">Total: {formatMoney(sale.totalValue)}</span>
    </div>

    <div className="space-y-3">
      <Label className="text-gray-500">Líneas a devolver</Label>
      {sale.items.map((item) => {
        const returned = alreadyReturned[item.id] ?? 0;
        const remaining = item.quantity - returned;
        const line = lines.find((l) => l.saleItemId === item.id)!;
        return (
          <div key={item.id} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 text-sm text-gray-600 dark:text-gray-300">
              {(item.lineType === "inventory_item" ? itemNames[item.referenceId] : undefined) ?? (item.lineType === "inventory_item" ? "Producto" : "Servicio")} · cant. {item.quantity} ·{" "}
              {formatMoney(item.unitPrice)} c/u
              {returned > 0 && <span className="text-amber-500"> · ya devuelto: {returned}</span>}
            </div>
            <div className="w-full sm:w-24">
              <Input
                type="number"
                placeholder="Cant."
                value={line.quantity}
                max={String(remaining)}
                onChange={(e) => onLineChange(item.id, { quantity: e.target.value })}
              />
            </div>
            <div className="w-full sm:w-32">
              <Input
                type="number"
                placeholder="Reembolso"
                value={line.refundAmount}
                onChange={(e) => onLineChange(item.id, { refundAmount: e.target.value })}
              />
            </div>
            {remaining <= 0 && <span className="text-xs text-red-500">Sin disponible</span>}
          </div>
        );
      })}
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Label className="text-gray-500">Método de reembolso</Label>
        <Select
          value={refundMethod}
          onChange={(value) => onRefundMethodChange(value as RefundMethod)}
          options={Object.entries(PAYMENT_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </div>
      <div>
        <Label className="text-gray-500">Motivo</Label>
        <Input placeholder="Motivo de la devolución" value={reason} onChange={(e) => onReasonChange(e.target.value)} />
      </div>
    </div>

    <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
      <span className="text-sm text-gray-500 dark:text-gray-400">Total a reembolsar</span>
      <span className="text-xl font-semibold text-gray-800 dark:text-white/90">{formatMoney(totalRefunded)}</span>
    </div>

    <Button type="submit" variant="primary" className="w-full" disabled={saving || !canSubmit}>
      <RotateCcw className="mr-1.5 size-4" />
      {saving ? "Procesando..." : "Confirmar devolución"}
    </Button>
  </form>
);
