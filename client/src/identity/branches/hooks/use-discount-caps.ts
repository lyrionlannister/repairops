import { useCallback, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import type { UserRole } from "@common/types/auth/permission";

export type CappedRole = Exclude<UserRole, "owner">;

export interface DiscountCap {
  role: CappedRole;
  maxDiscountPercent: string;
}

// Un valor vacío = sin fila = ese rol no puede dar descuento en la sucursal.
export type DiscountCapForm = Record<CappedRole, string>;

export const CAPPED_ROLES: CappedRole[] = ["cashier", "employee", "technician"];

const toForm = (caps: DiscountCap[]): DiscountCapForm => {
  const form: DiscountCapForm = { cashier: "", employee: "", technician: "" };
  caps.forEach((cap) => {
    form[cap.role] = cap.maxDiscountPercent;
  });
  return form;
};

const toPayload = (form: DiscountCapForm) =>
  CAPPED_ROLES.filter((role) => form[role].trim() !== "").map((role) => ({
    role,
    maxDiscountPercent: form[role].trim(),
  }));

export const useDiscountCaps = (branchId: string | null) => {
  const { apiClient } = useApiClient();
  const [form, setForm] = useState<DiscountCapForm>(toForm([]));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fetchCaps = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient(`/branches/${branchId}/discount-caps`);
      if (!res.ok) throw new Error("Error al cargar los topes de descuento");
      setForm(toForm(await res.json()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [apiClient, branchId]);

  const setCap = useCallback((role: CappedRole, value: string) => {
    setSaved(false);
    setForm((prev) => ({ ...prev, [role]: value }));
  }, []);

  const save = useCallback(async () => {
    if (!branchId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await apiClient(`/branches/${branchId}/discount-caps`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caps: toPayload(form) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Error al guardar los topes de descuento");
      }
      setForm(toForm(await res.json()));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }, [apiClient, branchId, form]);

  return { form, loading, saving, error, saved, fetchCaps, setCap, save };
};
