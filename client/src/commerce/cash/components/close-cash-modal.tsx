import type { FC } from "react";
import { EmployeeSelect } from "@common/components/employee-select";
import { Modal } from "@ui/modal/modal";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";

interface CloseCashModalProps {
  isOpen: boolean;
  closingBalance: string;
  closeReason: string;
  closeAuthorizedByEmployeeId: string;
  showCloseReasonField: boolean;
  showCloseAuthorizerField: boolean;
  saving: boolean;
  onClosingBalanceChange: (value: string) => void;
  onCloseReasonChange: (value: string) => void;
  onCloseAuthorizedByEmployeeIdChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const CloseCashModal: FC<CloseCashModalProps> = ({
  isOpen,
  closingBalance,
  closeReason,
  closeAuthorizedByEmployeeId,
  showCloseReasonField,
  showCloseAuthorizerField,
  saving,
  onClosingBalanceChange,
  onCloseReasonChange,
  onCloseAuthorizedByEmployeeIdChange,
  onCancel,
  onSubmit,
}) => (
  <Modal isOpen={isOpen} onClose={onCancel} className="max-w-md p-6 sm:p-8 mx-4">
    <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-gray-100">Cerrar caja</h2>
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label className="text-gray-500">Saldo de cierre (conteo físico)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={closingBalance}
          onChange={(event) => onClosingBalanceChange(event.target.value)}
          required
          disabled={saving}
        />
      </div>
      {showCloseReasonField && (
        <div>
          <Label className="text-gray-500">Motivo de la diferencia</Label>
          <Input
            placeholder="¿Por qué no cuadra la caja?"
            value={closeReason}
            onChange={(event) => onCloseReasonChange(event.target.value)}
            required
            disabled={saving}
          />
        </div>
      )}
      {showCloseAuthorizerField && (
        <div>
          <Label className="text-gray-500">Autorizado por (owner)</Label>
          <EmployeeSelect
            value={closeAuthorizedByEmployeeId}
            onChange={onCloseAuthorizedByEmployeeIdChange}
            disabled={saving}
          />
        </div>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Cerrando..." : "Cerrar caja"}
        </Button>
      </div>
    </form>
  </Modal>
);
