import { useState, useCallback } from "react";
import { useApiClient } from "@common/hooks/use-api-client";

export type PaymentMethod = "efectivo" | "tarjeta" | "transferencia" | "credito";
export type SaleItemLineType = "inventory_item" | "service_type";

export interface SaleItemInput {
  lineType: SaleItemLineType;
  referenceId: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
}

export interface Sale {
  id: string;
  localId: string;
  saleNumber: number;
  customerId: string | null;
  customerName: string | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalValue: number;
  createdByEmployeeId: string | null;
  createdAt: string;
}

export interface PaymentInput {
  method: PaymentMethod;
  amount: number;
  providerReference?: string;
  providerAuthorizationCode?: string;
}

export interface CreateSalePayload {
  localId: string;
  cashSessionId: string;
  customerId?: string;
  customerName?: string;
  payments: PaymentInput[];
  createdByEmployeeId?: string;
  idempotencyKey?: string;
  items: SaleItemInput[];
}

export const useSales = () => {
  const { apiClient } = useApiClient();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient("/sales");
      if (!res.ok) throw new Error("Error al cargar ventas");
      setSales(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const create = useCallback(
    async (data: CreateSalePayload): Promise<Sale | null> => {
      setCreating(true);
      setError(null);
      try {
        const res = await apiClient("/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? "Error al registrar la venta");
        }
        const sale: Sale = await res.json();
        setSales((prev) => [sale, ...prev]);
        return sale;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        return null;
      } finally {
        setCreating(false);
      }
    },
    [apiClient],
  );

  return { sales, loading, creating, error, fetchAll, create };
};
