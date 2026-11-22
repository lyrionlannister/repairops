import type { FC } from "react";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { ROLE_LABELS } from "@identity/users/hooks/use-users";
import { CAPPED_ROLES } from "../utils/discount-caps";
import type { DiscountCapsCardProps } from "../props/discount-caps-card-props";

export const DiscountCapsCard: FC<DiscountCapsCardProps> = ({ form, loading, saving, onChange, onSave }) => (
  <form
    onSubmit={(event) => {
      event.preventDefault();
      onSave();
    }}
    className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3"
  >
    <div>
      <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Topes de descuento</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Porcentaje máximo por renglón al vender en esta sucursal. Vacío: ese rol no puede dar descuento. El dueño no
        tiene tope; con varios roles vale el mayor.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {CAPPED_ROLES.map((role) => (
        <div key={role}>
          <Label className="text-gray-500">{ROLE_LABELS[role]} (%)</Label>
          <Input
            type="number"
            name={`cap-${role}`}
            min="0"
            max="100"
            step={0.01}
            placeholder="Sin descuento"
            value={form[role]}
            onChange={(event) => onChange(role, event.target.value)}
            disabled={loading || saving}
          />
        </div>
      ))}
    </div>

    <div className="flex justify-end">
      <Button type="submit" variant="primary" disabled={loading || saving}>
        Guardar topes
      </Button>
    </div>
  </form>
);
