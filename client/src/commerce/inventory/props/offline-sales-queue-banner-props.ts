import type { QueuedSale } from "../types/offline-sales-queue";

export interface OfflineSalesQueueBannerProps {
  offlineQueue: QueuedSale[];
  isOnline: boolean;
  syncing: boolean;
  onSync: () => void;
}
