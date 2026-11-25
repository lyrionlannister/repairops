import type { InventoryItem } from "../types/inventory";

export interface InventoryTransferFormProps {
  itemLabel: (item: InventoryItem) => string;
  fromItem: InventoryItem | null;
  onFromItemChange: (item: InventoryItem | null) => void;
  toItem: InventoryItem | null;
  onToItemChange: (item: InventoryItem | null) => void;
  sameItem: boolean;
  sameBranch: boolean;
  exceedsStock: boolean;
  quantity: string;
  onQuantityChange: (value: string) => void;
  reason: string;
  onReasonChange: (value: string) => void;
  creating: boolean;
  disabled: boolean;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
}
