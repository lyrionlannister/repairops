import { useCallback, useEffect, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import type { CreateSalePayload, Sale } from "./use-sales";

const STORAGE_KEY = "repairops_offline_sales_queue";
const COUNTER_KEY = "repairops_offline_sales_counter";

// Consecutivo propio, nunca reutilizado aunque la cola se vacie -- a
// diferencia de usar queue.length, no puede repetir un folio provisional ya
// usado por una venta que ya sincronizo y salio de la cola.
function nextLocalFolioNumber(): number {
  const current = Number(localStorage.getItem(COUNTER_KEY) ?? "0") + 1;
  try {
    localStorage.setItem(COUNTER_KEY, String(current));
  } catch {}
  return current;
}

export interface QueuedSale {
  localFolio: string;
  idempotencyKey: string;
  payload: CreateSalePayload;
  queuedAt: string;
  lastError?: string;
}

function readQueue(): QueuedSale[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedSale[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedSale[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // noop: si localStorage no esta disponible, la venta ya se intento
    // mandar directo -- no hay cola que persistir.
  }
}

// Sin backend nuevo: SaleService.create ya es idempotente por idempotencyKey
// desde Fase 2/3 -- sincronizar la misma venta dos veces (reintento manual
// mientras la primera seguia en vuelo) nunca duplica stock ni caja. El folio
// real (saleNumber) lo asigna el server al sincronizar, nunca antes -- el
// desorden cronologico resultante esta aceptado (ver plan Fase 5).
export const useOfflineSalesQueue = () => {
  const { apiClient } = useApiClient();
  const [queue, setQueue] = useState<QueuedSale[]>(() => readQueue());
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const enqueue = useCallback((payload: CreateSalePayload): QueuedSale => {
    if (!payload.idempotencyKey) {
      throw new Error("Una venta encolada sin conexión requiere idempotencyKey");
    }
    const queued: QueuedSale = {
      localFolio: `OFFLINE-${nextLocalFolioNumber()}`,
      idempotencyKey: payload.idempotencyKey,
      payload,
      queuedAt: new Date().toISOString(),
    };
    setQueue((prev) => {
      const next = [...prev, queued];
      writeQueue(next);
      return next;
    });
    return queued;
  }, []);

  // Reproduce la cola EN ORDEN -- si una falla por un error real (no solo
  // "seguimos offline"), se detiene ahi mismo sin perder ni reordenar las
  // demas; la proxima sincronizacion retoma desde esa misma venta.
  const sync = useCallback(async (): Promise<{ synced: number; remaining: number }> => {
    if (syncing) return { synced: 0, remaining: queue.length };
    setSyncing(true);
    let synced = 0;
    try {
      let current = readQueue();
      for (const item of current) {
        try {
          const res = await apiClient("/sales", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item.payload),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            const message = (body as { error?: string }).error ?? "Error al sincronizar";
            current = current.map((q) =>
              q.idempotencyKey === item.idempotencyKey ? { ...q, lastError: message } : q,
            );
            writeQueue(current);
            setQueue(current);
            break;
          }
          current = current.filter((q) => q.idempotencyKey !== item.idempotencyKey);
          writeQueue(current);
          setQueue(current);
          synced += 1;
        } catch {
          // Sigue sin red -- se detiene aqui, la cola queda intacta para el
          // proximo intento (evento "online" o boton manual).
          break;
        }
      }
      return { synced, remaining: current.length };
    } finally {
      setSyncing(false);
    }
  }, [apiClient, queue.length, syncing]);

  useEffect(() => {
    if (isOnline && queue.length > 0) sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // navigator.onLine solo refleja la interfaz de red del sistema operativo --
  // no detecta "el server no responde" (wifi conectado pero sin salida real,
  // o -- como en la prueba de esta rama con DevTools -- una emulacion de red
  // que bloquea el trafico sin tocar navigator.onLine). Por eso la decision
  // real de encolar nunca depende de isOnline: siempre se intenta el POST de
  // verdad, y solo se encola si la propia llamada falla por red.
  const submitOrQueue = useCallback(
    async (
      payload: CreateSalePayload,
    ): Promise<{ sale: Sale } | { queued: QueuedSale } | { error: string }> => {
      try {
        const res = await apiClient("/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          return { error: (body as { error?: string }).error ?? "Error al registrar la venta" };
        }
        return { sale: (await res.json()) as Sale };
      } catch {
        return { queued: enqueue(payload) };
      }
    },
    [apiClient, enqueue],
  );

  return { queue, isOnline, syncing, enqueue, sync, submitOrQueue };
};
