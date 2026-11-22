import type { Customer, CustomerDeviceHistoryEntry } from "../types/customers";

export interface CustomerDeviceHistoryModalProps {
  historyCustomer: Customer | null;
  devices: CustomerDeviceHistoryEntry[];
  onClose: () => void;
}
