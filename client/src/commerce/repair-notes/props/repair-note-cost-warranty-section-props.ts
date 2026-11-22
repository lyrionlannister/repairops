export interface RepairNoteCostSectionProps {
  totalValue: string;
  requiresAdvance: boolean;
  advanceValue: string;
  saving: boolean;
  onTotalValueChange: (value: string) => void;
  onRequiresAdvanceToggle: () => void;
  onAdvanceValueChange: (value: string) => void;
  // Solo al crear la nota: cómo y quién cobra el anticipo (entra a la caja abierta).
  advanceMethod?: string;
  advanceEmployeeId?: string;
  onAdvanceMethodChange?: (value: string) => void;
  onAdvanceEmployeeChange?: (value: string) => void;
  // El anticipo ya se cobró (entró a caja): no se edita.
  advanceLocked?: boolean;
}

export interface RepairNoteWarrantySectionProps {
  hasWarranty: boolean;
  hasExtendedWarranty: boolean;
  extendedWarrantyDays: string;
  saving: boolean;
  onHasWarrantyToggle: () => void;
  onHasExtendedWarrantyToggle: () => void;
  onExtendedWarrantyDaysChange: (value: string) => void;
}
