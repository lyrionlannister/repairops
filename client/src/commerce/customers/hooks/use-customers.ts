import { useState, useCallback } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import type { Customer, CustomerCreditBalance, CustomerDeviceHistoryEntry } from "../types/customers";
import { readApiError, apiErrorText } from "@common/utils/api-error";

export const useCustomers = () => {
  const { apiClient } = useApiClient();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [devices, setDevices] = useState<CustomerDeviceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchByCustomer = useCallback(
    async (customerId: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient(`/customers/${encodeURIComponent(customerId)}`);
        if (!res.ok) throw new Error(await readApiError(res, "Error al cargar el cliente"));
        setCustomers([await res.json()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    },
    [apiClient],
  );


  const fetchDevices = useCallback(
    async (customerId: string) => {
      try {
        const res = await apiClient(`/customers/${customerId}/devices`);
        if (!res.ok) return;
        setDevices(await res.json());
      } catch {
        setDevices([]);
      }
    },
    [apiClient],
  );

  const create = useCallback(
    async (
      data: Pick<Customer, "name" | "phone" | "email" | "creditLimit">,
    ): Promise<Customer | null> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient("/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(apiErrorText(body, "Error al crear cliente"));
        }
        const created: Customer = await res.json();
        setCustomers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [apiClient],
  );

  const update = useCallback(
    async (
      id: string,
      data: Pick<Customer, "name" | "phone" | "email" | "creditLimit">,
    ): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient(`/customers/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(apiErrorText(body, "Error al actualizar cliente"));
        }
        const updated: Customer = await res.json();
        setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [apiClient],
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      try {
        const res = await apiClient(`/customers/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(await readApiError(res, "Error al eliminar cliente"));
        setCustomers((prev) => prev.filter((c) => c.id !== id));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
        return false;
      }
    },
    [apiClient],
  );

  const [creditBalances, setCreditBalances] = useState<Record<string, CustomerCreditBalance>>({});

  const fetchCreditBalance = useCallback(
    async (customerId: string) => {
      try {
        const res = await apiClient(`/customers/${customerId}/credit-balance`);
        if (!res.ok) return;
        const balance: CustomerCreditBalance = await res.json();
        setCreditBalances((prev) => ({ ...prev, [customerId]: balance }));
      } catch {
        // noop: la ficha ya tiene el limite configurado como respaldo
      }
    },
    [apiClient],
  );

  return {
    customers,
    devices,
    creditBalances,
    loading,
    saving,
    error,
    fetchByCustomer,
    fetchDevices,
    fetchCreditBalance,
    create,
    update,
    remove,
  };
};
