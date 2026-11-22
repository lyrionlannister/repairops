import type { CustomerDeviceHistoryEntry } from "../types/customers";
import type { LayawayRecord } from "../types/layaways";

export interface CustomerContextPanelProps {
  creditLimit: number;
  creditBalance: number;
  creditAvailable: number;
  creditLoaded: boolean;
  devices: CustomerDeviceHistoryEntry[];
  activeLayaways: LayawayRecord[];
}
