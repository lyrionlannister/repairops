import type { FC } from "react";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Toggle } from "@ui/toggle/toggle";
import { SectionTitle } from "./section-title";

interface RepairNoteCostSectionProps {
  totalValue: string;
  requiresAdvance: boolean;
  advanceValue: string;
  saving: boolean;
  onTotalValueChange: (value: string) => void;
  onRequiresAdvanceToggle: () => void;
  onAdvanceValueChange: (value: string) => void;
}

export const RepairNoteCostSection: FC<RepairNoteCostSectionProps> = ({
  totalValue,
  requiresAdvance,
  advanceValue,
  saving,
  onTotalValueChange,
  onRequiresAdvanceToggle,
  onAdvanceValueChange,
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3 space-y-4">
    <SectionTitle>Costo</SectionTitle>
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <Label className="text-gray-500">Valor total ($)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={totalValue}
          onChange={(e) => onTotalValueChange(e.target.value)}
          disabled={saving}
        />
      </div>
      <div>
        <Label className="text-gray-500">Requiere anticipo</Label>
        <div className="mt-1.5 flex h-10.5 items-center">
          <Toggle checked={requiresAdvance} onChange={onRequiresAdvanceToggle} disabled={saving} />
        </div>
      </div>
      {requiresAdvance && (
        <div>
          <Label className="text-gray-500">Valor de anticipo ($)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={advanceValue}
            onChange={(e) => onAdvanceValueChange(e.target.value)}
            disabled={saving}
          />
        </div>
      )}
    </div>
  </div>
);

interface RepairNoteWarrantySectionProps {
  hasWarranty: boolean;
  hasExtendedWarranty: boolean;
  extendedWarrantyDays: string;
  saving: boolean;
  onHasWarrantyToggle: () => void;
  onHasExtendedWarrantyToggle: () => void;
  onExtendedWarrantyDaysChange: (value: string) => void;
}

export const RepairNoteWarrantySection: FC<RepairNoteWarrantySectionProps> = ({
  hasWarranty,
  hasExtendedWarranty,
  extendedWarrantyDays,
  saving,
  onHasWarrantyToggle,
  onHasExtendedWarrantyToggle,
  onExtendedWarrantyDaysChange,
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3 space-y-4">
    <SectionTitle>Garantía</SectionTitle>
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <Label className="text-gray-500">Con garantía</Label>
        <div className="mt-1.5 flex h-10.5 items-center">
          <Toggle checked={hasWarranty} onChange={onHasWarrantyToggle} disabled={saving} />
        </div>
      </div>
      <div>
        <Label className="text-gray-500">Garantía extendida</Label>
        <div className="mt-1.5 flex h-10.5 items-center">
          <Toggle checked={hasExtendedWarranty} onChange={onHasExtendedWarrantyToggle} disabled={saving} />
        </div>
      </div>
      {hasExtendedWarranty && (
        <div>
          <Label className="text-gray-500">Días de garantía extendida</Label>
          <Input
            type="number"
            min="1"
            placeholder="Ej. 30"
            value={extendedWarrantyDays}
            onChange={(e) => onExtendedWarrantyDaysChange(e.target.value)}
            disabled={saving}
          />
        </div>
      )}
    </div>
  </div>
);
