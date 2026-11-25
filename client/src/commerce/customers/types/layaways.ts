export interface LayawayItemRecord {
  id: string;
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
}

export interface LayawayRecord {
  id: string;
  customerId: string;
  customerName?: string | null;
  status: LayawayStatus;
  totalValue: number;
  depositAmount: number;
  depositMethod: LayawayMethod;
  expiresAt: string;
  createdAt: string;
  items?: LayawayItemRecord[];
}

export interface OpenLayawayItemInput {
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
}

export interface OpenLayawayPayload {
  customerId: string;
  cashSessionId: string;
  depositAmount: number;
  depositMethod: LayawayMethod;
  expiresAt: string;
  items: OpenLayawayItemInput[];
}

export type LayawayStatus = "open" | "completed" | "cancelled" | "expired";

export type LayawayStatusFilter = LayawayStatus | "all";

export type LayawayMethod = "efectivo" | "tarjeta" | "transferencia";
