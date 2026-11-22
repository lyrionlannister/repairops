import { useCallback, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import type { CustomerPaymentRecord, RegisterCustomerPaymentInput } from "../types/customer-payments";

export const useCustomerPayments = () => {
  const { apiClient } = useApiClient();
  const [payments, setPayments] = useState<CustomerPaymentRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(
    async (customerId: string) => {
      try {
        const res = await apiClient(`/customers/${customerId}/payments`);
        if (!res.ok) return;
        setPayments(await res.json());
      } catch {
        setPayments([]);
      }
    },
    [apiClient],
  );

  const registerPayment = useCallback(
    async (customerId: string, input: RegisterCustomerPaymentInput): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient(`/customers/${customerId}/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string | string[] }).error?.toString() ?? "Error al registrar el abono");
        }
        await fetchPayments(customerId);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [apiClient, fetchPayments],
  );

  return { payments, saving, error, fetchPayments, registerPayment, clearError: () => setError(null) };
};
