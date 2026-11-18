import type { FC } from "react";
import type { CashMovementForm } from "../hooks/use-cash-page";
import { EmployeeSelect } from "@common/components/employee-select";
import { Modal } from "@ui/modal/modal";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";
import { METHOD_LABELS } from "../utils/format";

interface RegisterMovementModalProps {
  isOpen: boolean;
  movementForm: CashMovementForm;
  saving: boolean;
  cashRoundingUnit: number | undefined;
  onClose: () => void;
  onFormChange: (updater: (prev: CashMovementForm) => CashMovementForm) => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
}

export const RegisterMovementModal: FC<RegisterMovementModalProps> = ({
  isOpen,
  movementForm,
  saving,
  cashRoundingUnit,
  onClose,
  onFormChange,
  onSubmit,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6 sm:p-8 mx-4">
    <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-gray-100">
      Registrar movimiento
    </h2>
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-500">Tipo</Label>
          <Select
            value={movementForm.type}
            onChange={(value) =>
              onFormChange((prev) => ({ ...prev, type: value as typeof movementForm.type }))
            }
            disabled={saving}
            options={[
              { value: "income", label: "Ingreso" },
              { value: "expense", label: "Egreso" },
            ]}
          />
        </div>
        <div>
          <Label className="text-gray-500">Método</Label>
          <Select
            value={movementForm.method}
            onChange={(value) =>
              onFormChange((prev) => ({ ...prev, method: value as typeof movementForm.method }))
            }
            disabled={saving}
            options={Object.entries(METHOD_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </div>
      </div>
      <div>
        <Label className="text-gray-500">Monto</Label>
        <Input
          type="number"
          min="0.01"
          step="0.01"
          value={movementForm.amount}
          onChange={(event) => onFormChange((prev) => ({ ...prev, amount: event.target.value }))}
          required
          disabled={saving}
        />
        {movementForm.method === "efectivo" && Number(cashRoundingUnit) > 0 && (
          <p className="mt-1 text-xs text-gray-400">
            Se redondeará al múltiplo de {cashRoundingUnit} más cercano.
          </p>
        )}
      </div>
      <div>
        <Label className="text-gray-500">Nota</Label>
        <Input
          placeholder="Opcional"
          value={movementForm.note}
          onChange={(event) => onFormChange((prev) => ({ ...prev, note: event.target.value }))}
          disabled={saving}
        />
      </div>
      <div>
        <Label className="text-gray-500">Empleado</Label>
        <EmployeeSelect
          value={movementForm.createdByEmployeeId}
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
          disabled={saving || !movementForm.createdByEmployeeId}
        >
          {saving ? "Guardando..." : "Registrar"}
        </Button>
      </div>
    </form>
  </Modal>
);
