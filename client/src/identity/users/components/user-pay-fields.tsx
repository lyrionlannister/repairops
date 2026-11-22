import type { FC } from "react";

import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";
import { PAY_CYCLE_LABELS } from "../hooks/use-users";
import type { UserPayFieldsProps } from "../props/user-pay-fields-props";

export const UserPayFields: FC<UserPayFieldsProps> = ({ form, disabled, onChange }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div>
      <Label className="text-gray-500">Ciclo de pago</Label>
      <Select
        value={form.payCycle}
        onChange={(value) => onChange("payCycle", value)}
        disabled={disabled}
        placeholder="Sin ciclo de pago"
        options={Object.entries(PAY_CYCLE_LABELS).map(([value, label]) => ({ value, label }))}
      />
    </div>

    <div>
      <Label className="text-gray-500">Salario</Label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 text-sm text-gray-400">
          $
        </span>
        <Input
          type="number"
          placeholder="4500"
          name="salaryAmount"
          className="pl-8!"
          value={form.salaryAmount}
          onChange={(e) => onChange("salaryAmount", e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  </div>
);
