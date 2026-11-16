import type { FC } from "react";
import type { InventoryItem } from "../hooks/use-inventory";
import type { InventoryMovementForm } from "../hooks/use-inventory-page";
import { EmployeeSelect } from "@common/components/employee-select";
import { Modal } from "@ui/modal/modal";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";

interface InventoryMovementModalProps {
  movementItem: InventoryItem | null;
  movementForm: InventoryMovementForm;
  saving: boolean;
  onClose: () => void;
  onFormChange: (updater: (prev: InventoryMovementForm) => InventoryMovementForm) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const InventoryMovementModal: FC<InventoryMovementModalProps> = ({
  movementItem,
  movementForm,
  saving,
  onClose,
  onFormChange,
  onSubmit,
}) => (
  <Modal isOpen={movementItem !== null} onClose={onClose} className="max-w-md p-6 sm:p-8 mx-4">
    <h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-gray-100">Registrar movimiento</h2>
    <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">{movementItem?.name}</p>
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-500">Tipo</Label>
          <Select
            value={movementForm.type}
            onChange={(value) => onFormChange((prev) => ({ ...prev, type: value as typeof movementForm.type }))}
            disabled={saving}
            options={[
              { value: "in", label: "Entrada" },
              { value: "out", label: "Salida" },
              { value: "adjustment", label: "Ajuste (+/-)" },
            ]}
          />
        </div>
        <div>
          <Label className="text-gray-500">Cantidad</Label>
          <Input
            type="number"
            placeholder="Ej. 5"
            value={movementForm.quantity}
            onChange={(event) => onFormChange((prev) => ({ ...prev, quantity: event.target.value }))}
            required
            disabled={saving}
          />
        </div>
      </div>
      <div>
        <Label className="text-gray-500">Motivo</Label>
        <Input
          placeholder="Opcional"
          value={movementForm.reason}
          onChange={(event) => onFormChange((prev) => ({ ...prev, reason: event.target.value }))}
          disabled={saving}
        />
      </div>
      <div>
        <Label className="text-gray-500">Empleado</Label>
        <EmployeeSelect
          value={movementForm.createdByEmployeeId}
          onChange={(employeeId) => onFormChange((prev) => ({ ...prev, createdByEmployeeId: employeeId }))}
          disabled={saving}
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Guardando..." : "Registrar"}
        </Button>
      </div>
    </form>
  </Modal>
);
