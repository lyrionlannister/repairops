import type { InventoryItem } from "../types/inventory";

export interface InventoryTransferFormProps {
  items: InventoryItem[];
  itemLabel: (item: InventoryItem) => string;
  fromItemId: string;
  onFromItemIdChange: (value: string) => void;
  toItemId: string;
  onToItemIdChange: (value: string) => void;
  sameBranch: boolean;
  quantity: string;
  onQuantityChange: (value: string) => void;
  reason: string;
  onReasonChange: (value: string) => void;
  creating: boolean;
  disabled: boolean;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
}
