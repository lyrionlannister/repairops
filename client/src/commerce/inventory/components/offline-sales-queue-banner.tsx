import type { FC } from "react";
import type { QueuedSale } from "../hooks/use-offline-sales-queue";
import { Button } from "@ui/button/button";

interface OfflineSalesQueueBannerProps {
  offlineQueue: QueuedSale[];
  isOnline: boolean;
  syncing: boolean;
  onSync: () => void;
}

export const OfflineSalesQueueBanner: FC<OfflineSalesQueueBannerProps> = ({
  offlineQueue,
  isOnline,
  syncing,
  onSync,
}) => (
  <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
    <span className="text-amber-700 dark:text-amber-400">
      {offlineQueue.length} {offlineQueue.length === 1 ? "venta pendiente" : "ventas pendientes"} de sincronizar
      {offlineQueue.some((q) => q.lastError) && " (una con error, revisa al reconectar)"}
    </span>
    <Button type="button" variant="outline" onClick={onSync} disabled={!isOnline || syncing}>
      {syncing ? "Sincronizando..." : "Sincronizar ahora"}
    </Button>
  </div>
);
