import type { FC } from "react";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";

import type { PlanOption, SubscriptionFormData } from "../hooks/use-platform-tenants";
import { STATUS_LABELS } from "../utils/format";

interface SubscriptionFormProps {
  form: SubscriptionFormData;
  plans: PlanOption[];
  disabled: boolean;
  onChange: (field: keyof SubscriptionFormData, value: string) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

const limitLabel = (value: number | null, one: string, many: string) =>
  value === null ? `${many} sin límite` : `${value} ${value === 1 ? one : many}`;

export const SubscriptionForm: FC<SubscriptionFormProps> = ({
  form,
  plans,
  disabled,
  onChange,
  onSubmit,
  onCancel,
}) => (
  <form
    onSubmit={onSubmit}
    className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3"
  >
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <Label className="text-gray-500">Plan</Label>
        <Select
          value={form.planKey}
          onChange={(value) => onChange("planKey", value)}
          disabled={disabled}
          options={plans.map((plan) => ({
            value: plan.key,
            label: `${plan.name} (${limitLabel(plan.maxUsers, "usuario", "usuarios")}, ${limitLabel(plan.maxBranches, "sucursal", "sucursales")})`,
          }))}
        />
      </div>
      <div>
        <Label className="text-gray-500">Estado</Label>
        <Select
          value={form.status}
          onChange={(value) => onChange("status", value)}
          disabled={disabled}
          options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </div>
      <div>
        <Label className="text-gray-500">Usuarios extra</Label>
        <Input
          type="number"
          name="extraUsers"
          min="0"
          step={1}
          value={form.extraUsers}
          onChange={(event) => onChange("extraUsers", event.target.value)}
          disabled={disabled}
        />
      </div>
      <div>
        <Label className="text-gray-500">Sucursales extra</Label>
        <Input
          type="number"
          name="extraBranches"
          min="0"
          step={1}
          value={form.extraBranches}
          onChange={(event) => onChange("extraBranches", event.target.value)}
          disabled={disabled}
        />
      </div>
    </div>

    <p className="text-xs text-gray-500 dark:text-gray-400">
      Bajar de plan o quitar extras solo procede si el uso actual del taller ya cabe.
    </p>

    <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" variant="primary" disabled={disabled}>
        Guardar
      </Button>
    </div>
  </form>
);
