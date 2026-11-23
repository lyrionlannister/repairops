import type { FC } from "react";
import { describeDevices } from "../utils/devices";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@ui/modal/modal";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";
import { DatePicker } from "@ui/date-picker/date-picker";
import { Button } from "@ui/button/button";
import { EmployeeSelect } from "@common/components/employee-select";
import { formatCurrency } from "../utils/format";
import type { DeliveryMethod } from "../types/repair-note-delivery";
import type { RepairNoteDeliveryModalProps } from "../props/repair-note-delivery-modal-props";

const METHOD_OPTIONS: Array<{ value: DeliveryMethod; label: string }> = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "transferencia", label: "Transferencia" },
  { value: "credito", label: "Crédito" },
];
const SummaryRow: FC<{ label: string; value: string; strong?: boolean }> = ({
  label,
  value,
  strong,
}) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-500 dark:text-gray-400">{label}</span>
    <span
      className={
        strong
          ? "text-lg font-bold text-gray-800 dark:text-white/90"
          : "font-medium text-gray-800 dark:text-white/90"
      }
    >
      {value}
    </span>
  </div>
);

export const RepairNoteDeliveryModal: FC<RepairNoteDeliveryModalProps> = ({
  isOpen,
  note,
  total,
  advancePaid,
  balance,
  payments,
  paymentsSum,
  employeeId,
  credit,
  hasCashSession,
  hasCashPayment,
  problem,
  error,
  saving,
  onClose,
  onEmployeeChange,
  onPaymentChange,
  onAddPayment,
  onRemovePayment,
  onSubmit,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
      Entregar nota #{note?.controlNumber}
    </h3>
    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {note?.customerName} · {describeDevices(note?.devices ?? [])}
    </p>

    <div className="mt-4 space-y-2 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <SummaryRow label="Total de la reparación" value={formatCurrency(total)} />
      {advancePaid > 0 && (
        <SummaryRow label="Anticipo cobrado" value={`− ${formatCurrency(advancePaid)}`} />
      )}
      <div className="border-t border-gray-200 pt-2 dark:border-gray-800">
        <SummaryRow label="Saldo pendiente" value={formatCurrency(balance)} strong />
      </div>
    </div>

    {balance === 0 ? (
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        No hay saldo por cobrar: la nota ya está pagada.
      </p>
    ) : (
      <div className="mt-4 space-y-3">
        <Label className="text-gray-500">Pago</Label>
        {payments.map((payment, index) => (
          <div key={index} className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-44 shrink-0">
              <Select
                value={payment.method}
                onChange={(value) => onPaymentChange(index, { method: value as DeliveryMethod })}
                options={METHOD_OPTIONS}
                disabled={saving}
              />
            </div>
            <div className="flex-1">
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Monto"
                value={payment.amount}
                onChange={(e) => onPaymentChange(index, { amount: e.target.value })}
                disabled={saving}
              />
            </div>
            {payments.length > 1 && (
              <button
                type="button"
                onClick={() => onRemovePayment(index)}
                aria-label="Quitar pago"
                className="rounded-lg p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
          {payment.method === "credito" && (
            <div>
              <Label className="text-gray-500">Fecha límite de pago</Label>
              <DatePicker
                value={payment.dueDate ?? ""}
                onChange={(dueDate) => onPaymentChange(index, { dueDate })}
                disabled={saving}
              />
            </div>
          )}
          </div>
        ))}
        <Button type="button" variant="outline" onClick={onAddPayment} disabled={saving}>
          <Plus className="mr-1.5 size-4" />
          Dividir pago
        </Button>

        {payments.some((p) => p.method === "credito") && (
          <p className="rounded-lg bg-violet-50 p-3 text-sm text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
            {credit
              ? `Crédito del cliente: límite ${formatCurrency(credit.creditLimit)}, debe ${formatCurrency(credit.balance)}, disponible ${formatCurrency(credit.available)}.`
              : "Cargando crédito del cliente…"}
          </p>
        )}

        {hasCashPayment && (
          <div>
            <Label className="text-gray-500">Cobra</Label>
            <EmployeeSelect value={employeeId} onChange={onEmployeeChange} disabled={saving} />
            {!hasCashSession && (
              <p className="mt-1.5 text-sm text-red-500">
                No hay una caja abierta en esta sucursal. Ábrela en Caja para cobrar.
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Pagos registrados: {formatCurrency(paymentsSum)} de {formatCurrency(balance)}.
          {hasCashPayment &&
            " Efectivo, tarjeta y transferencia entran como ingreso en la caja abierta."}
        </p>
      </div>
    )}

    {(problem || error) && <p className="mt-3 text-sm text-red-500">{error ?? problem}</p>}

    <div className="mt-5 flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
        Cancelar
      </Button>
      <Button
        type="button"
        variant="primary"
        onClick={onSubmit}
        disabled={saving || Boolean(problem)}
      >
        {saving ? "Guardando..." : balance === 0 ? "Entregar" : "Cobrar y entregar"}
      </Button>
    </div>
  </Modal>
);
