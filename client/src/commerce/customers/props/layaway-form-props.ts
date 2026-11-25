import type { LayawayItemLine } from "../types/layaway-item-lines";
import type { LayawayMethod } from "../types/layaways";
import type { InventoryItem } from "@commerce/inventory/types/inventory";

export interface LayawayFormProps {
  hasContext: boolean;
  customerId: string;
  onCustomerIdChange: (value: string) => void;
  expiresAt: string;
  onExpiresAtChange: (value: string) => void;
  branchId: string | null;
  lines: LayawayItemLine[];
  onUpdateLine: (index: number, patch: Partial<LayawayItemLine>) => void;
  onItemChange: (index: number, item: InventoryItem | null) => void;
  onAddLine: () => void;
  depositAmount: string;
  onDepositAmountChange: (value: string) => void;
  depositMethod: LayawayMethod;
  onDepositMethodChange: (value: LayawayMethod) => void;
  totalValue: number;
  saving: boolean;
  hasCashSession: boolean;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}
