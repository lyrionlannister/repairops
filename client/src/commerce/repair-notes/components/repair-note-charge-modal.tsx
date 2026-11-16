import type { FC } from "react";
import type { CashMovementMethod, CashSessionRecord } from "@commerce/cash/hooks/use-cash";
import { Modal } from "@ui/modal/modal";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";
import { Button } from "@ui/button/button";
import { EmployeeSelect } from "@common/components/employee-select";

interface RepairNoteChargeModalProps {
  isOpen: boolean;
  cashSession: CashSessionRecord | null;
  cashError: string | null;
  cashAmount: string;
  cashMethod: CashMovementMethod;
  cashEmployeeId: string;
  cashSaving: boolean;
  onClose: () => void;
  onCashAmountChange: (value: string) => void;
  onCashMethodChange: (value: CashMovementMethod) => void;
  onCashEmployeeIdChange: (value: string) => void;
  onRegisterCharge: () => void;
}

export const RepairNoteChargeModal: FC<RepairNoteChargeModalProps> = ({
  isOpen,
  cashSession,
  cashAmount,
  cashMethod,
  cashEmployeeId,
  cashSaving,
  onClose,
  onCashAmountChange,
  onCashMethodChange,
  onCashEmployeeIdChange,
  onRegisterCharge,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Cobrar entrega</h3>
    {isOpen && !cashSession ? (
      <div className="mt-4 space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No hay una sesión de caja abierta para este local. La nota se guardó como entregada; puedes
          continuar sin registrar el cobro.
        </p>
        <div className="flex justify-end">
          <Button type="button" variant="primary" onClick={onClose}>
            Continuar
          </Button>
        </div>
      </div>
    ) : (
      <div className="mt-4 space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Saldo a cobrar (total menos anticipo). Puedes ajustarlo si se cobró distinto.
        </p>
        <div>
          <Label className="text-gray-500">Monto ($)</Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={cashAmount}
            onChange={(e) => onCashAmountChange(e.target.value)}
            disabled={cashSaving}
          />
        </div>
        <div>
          <Label className="text-gray-500">Método</Label>
          <Select
            value={cashMethod}
            onChange={(value) => onCashMethodChange(value as CashMovementMethod)}
            disabled={cashSaving}
            options={[
              { value: "efectivo", label: "Efectivo" },
              { value: "tarjeta", label: "Tarjeta" },
              { value: "transferencia", label: "Transferencia" },
            ]}
          />
        </div>
        <div>
          <Label className="text-gray-500">Empleado</Label>
          <EmployeeSelect value={cashEmployeeId} onChange={onCashEmployeeIdChange} disabled={cashSaving} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose} disabled={cashSaving}>
            Omitir cobro
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onRegisterCharge}
            disabled={cashSaving || !cashEmployeeId || Number(cashAmount) <= 0}
          >
            {cashSaving ? "Guardando..." : "Registrar cobro"}
          </Button>
        </div>
      </div>
    )}
  </Modal>
);
