import type { FC } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";
import { DatePicker } from "@ui/date-picker/date-picker";
import { PAYMENT_LABELS, formatMoney } from "../utils/format";
import type { PaymentMethod } from "../types/sales";
import type { SalePaymentsSectionProps } from "../props/sale-payments-section-props";

export const SalePaymentsSection: FC<SalePaymentsSectionProps> = ({
  payments,
  isOnline,
  paymentsSum,
  paymentsMatchTotal,
  hasCreditoWithoutCustomer,
  hasCreditoWithoutDueDate,
  total,
  onPaymentChange,
  onAddPayment,
  onRemovePayment,
}) => (
  <div className="space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
    <Label className="text-gray-500">Pago</Label>
    {payments.map((payment, index) => (
      <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="w-full sm:w-40">
          <Select
            value={payment.method}
            onChange={(value) => onPaymentChange(index, { method: value as PaymentMethod })}
            options={Object.entries(PAYMENT_LABELS).map(([value, label]) => ({ value, label }))}
            disabled={!isOnline}
          />
        </div>
        <div className="w-full sm:w-32">
          <Input
            type="number"
            placeholder="Monto"
            value={payment.amount}
            onChange={(e) => onPaymentChange(index, { amount: e.target.value })}
          />
        </div>
        {payment.method === "tarjeta" && (
          <>
            <div className="flex-1">
              <Input
                placeholder="Referencia de la terminal"
                value={payment.providerReference}
                onChange={(e) => onPaymentChange(index, { providerReference: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Código de autorización"
                value={payment.providerAuthorizationCode}
                onChange={(e) => onPaymentChange(index, { providerAuthorizationCode: e.target.value })}
              />
            </div>
          </>
        )}
        {payment.method === "credito" && (
          <div className="w-full sm:w-48">
            <DatePicker
              placeholder="Fecha límite de pago"
              value={payment.dueDate}
              onChange={(dueDate) => onPaymentChange(index, { dueDate })}
            />
          </div>
        )}
        {payments.length > 1 && (
          <button
            type="button"
            onClick={() => onRemovePayment(index)}
            className="p-2.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    ))}
    <Button type="button" variant="outline" onClick={onAddPayment}>
      <Plus className="mr-1.5 size-4" />
      Dividir pago
    </Button>
    {!paymentsMatchTotal && (
      <p className="text-sm text-red-500">
        Los pagos suman {formatMoney(paymentsSum)}, pero el total es {formatMoney(total)}.
      </p>
    )}
    {hasCreditoWithoutCustomer && (
      <p className="text-sm text-red-500">Una venta a crédito requiere elegir un cliente registrado.</p>
    )}
    {hasCreditoWithoutDueDate && (
      <p className="text-sm text-red-500">Indica la fecha límite en la que el cliente debe pagar el crédito.</p>
    )}
  </div>
);
