import type { CustomerDeviceHistoryEntry, CustomerDeviceVisit } from "./customers";

export interface CustomerDeviceVisitView extends CustomerDeviceVisit {
  serviceTypeNames: string[];
  statusLabel: string;
  statusClassName: string;
}

export interface CustomerDeviceView extends Omit<CustomerDeviceHistoryEntry, "visits"> {
  visits: CustomerDeviceVisitView[];
}
