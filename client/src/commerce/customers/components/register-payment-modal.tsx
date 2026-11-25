import type { FC } from "react";
import { EmployeeSelect } from "@common/components/employee-select";
import { Modal } from "@ui/modal/modal";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";
import { METHOD_LABELS } from "../utils/format";
import type { CustomerPaymentMethod } from "../types/customer-payments";
import type { RegisterPaymentModalProps } from "../props/register-payment-modal-props";

export const RegisterPaymentModal: FC<RegisterPaymentModalProps> = ({
  isOpen,
  form,
  balance,
  saving,
  error,
  onFormChange,
  onClose,
  onSubmit,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6 sm:p-8 mx-4">
    <h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-gray-100">Registrar abono</h2>
    <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
      Debe {Number(balance).toLocaleString("es-MX", { style: "currency", currency: "MXN" })}.
    </p>
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div>
        <Label className="text-gray-500">Monto</Label>
        <Input
          type="number"
          min="0.01"
          max={String(balance)}
          step="0.01"
          value={form.amount}
          onChange={(event) => onFormChange((prev) => ({ ...prev, amount: event.target.value }))}
          required
          disabled={saving}
        />
      </div>
      <div>
        <Label className="text-gray-500">Método</Label>
        <Select
          value={form.method}
          onChange={(value) =>
            onFormChange((prev) => ({ ...prev, method: value as CustomerPaymentMethod }))
          }
          disabled={saving}
          options={Object.entries(METHOD_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </div>
      <div>
        <Label className="text-gray-500">Quién cobra</Label>
        <EmployeeSelect
          value={form.createdByEmployeeId}
          onChange={(employeeId) =>
            onFormChange((prev) => ({ ...prev, createdByEmployeeId: employeeId }))
          }
          disabled={saving}
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={saving || !form.createdByEmployeeId || !form.amount}
        >
          {saving ? "Guardando..." : "Registrar"}
        </Button>
      </div>
    </form>
  </Modal>
);
