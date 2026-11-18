import type { FC } from "react";
import { EmployeeSelect } from "@common/components/employee-select";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";

interface OpenCashFormProps {
  openingBalance: string;
  openedByEmployeeId: string;
  saving: boolean;
  onOpeningBalanceChange: (value: string) => void;
  onOpenedByEmployeeIdChange: (value: string) => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
}

export const OpenCashForm: FC<OpenCashFormProps> = ({
  openingBalance,
  openedByEmployeeId,
  saving,
  onOpeningBalanceChange,
  onOpenedByEmployeeIdChange,
  onSubmit,
}) => (
  <div className="max-w-md space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Abrir caja</p>
    <p className="text-xs text-gray-500 dark:text-gray-400">No hay una sesión de caja abierta para este local.</p>
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label className="text-gray-500">Saldo de apertura</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={openingBalance}
          onChange={(event) => onOpeningBalanceChange(event.target.value)}
          disabled={saving}
        />
      </div>
      <div>
        <Label className="text-gray-500">Empleado que abre</Label>
        <EmployeeSelect value={openedByEmployeeId} onChange={onOpenedByEmployeeIdChange} disabled={saving} />
      </div>
      <Button type="submit" variant="primary" className="w-full" disabled={saving}>
        {saving ? "Abriendo..." : "Abrir caja"}
      </Button>
    </form>
  </div>
);
