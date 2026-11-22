import type { InventoryItem } from "../types/inventory";
import type { InventoryMovementForm } from "../types/inventory-page";

export interface InventoryMovementModalProps {
  movementItem: InventoryItem | null;
  movementForm: InventoryMovementForm;
  saving: boolean;
  onClose: () => void;
  onFormChange: (updater: (prev: InventoryMovementForm) => InventoryMovementForm) => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
}
