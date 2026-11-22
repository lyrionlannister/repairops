import type { CashMovementForm } from "../types/cash-page";

export interface RegisterMovementModalProps {
  isOpen: boolean;
  movementForm: CashMovementForm;
  saving: boolean;
  cashRoundingUnit: number | undefined;
  onClose: () => void;
  onFormChange: (updater: (prev: CashMovementForm) => CashMovementForm) => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
}
