import type { FC } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";
import { CashBoard } from "@commerce/cash/components/cash-board";
import { CashBranchesPanel } from "@commerce/cash/components/cash-branches-panel";
import { SettingsSection } from "./settings-section";
import { CURRENCY_OPTIONS } from "../utils/local-options";
import { LOCAL_SETTINGS_FORM_ID } from "../utils/local-tabs";
import type { LocalCashSectionProps } from "../props/local-cash-section-props";

export const LocalCashSection: FC<LocalCashSectionProps> = ({
  form,
  saving,
  onChange,
  onSetField,
  cashBranchId,
  onViewCashBranch,
  onSubmit,
}) => (
  <SettingsSection
    tab="cash"
    title="Caja"
    description="Moneda, redondeo de efectivo y el estado de la caja de cada sucursal."
  >
    {/* El tablero de caja trae sus propios formularios: queda fuera de este. */}
    <form
      id={LOCAL_SETTINGS_FORM_ID}
      onSubmit={onSubmit}
      className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
    >
      <div>
        <Label className="text-gray-500">Moneda</Label>
        <Select
          value={form.currency}
          onChange={(value) => onSetField("currency", value)}
          options={CURRENCY_OPTIONS}
          disabled={saving}
        />
      </div>
      <div>
        <Label htmlFor="cashRoundingUnit" className="text-gray-500">
          Redondeo de efectivo
        </Label>
        <Input
          id="cashRoundingUnit"
          type="number"
          name="cashRoundingUnit"
          min="0"
          step="0.01"
          placeholder="0 = sin redondeo"
          value={form.cashRoundingUnit}
          onChange={onChange}
          disabled={saving}
        />
      </div>
      <p className="self-center text-xs text-gray-400 md:col-span-2">
        Ej. 0.50 redondea los cobros en efectivo al medio peso más cercano; 0 lo desactiva. Tarjeta
        y transferencia nunca redondean.
      </p>
    </form>

    <div className="border-t border-gray-100 pt-6 dark:border-gray-800">
      {cashBranchId ? (
        <div className="space-y-5">
          <Button type="button" variant="outline" onClick={() => onViewCashBranch(null)}>
            <ArrowLeft className="size-4" aria-hidden />
            Todas las cajas
          </Button>
          <CashBoard branchId={cashBranchId} />
        </div>
      ) : (
        <CashBranchesPanel onView={onViewCashBranch} />
      )}
    </div>
  </SettingsSection>
);
