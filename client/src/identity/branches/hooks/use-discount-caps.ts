import { useCallback, useEffect, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import type { UserRole } from "@common/types/auth/permission";
import { capsToForm, capsToPayload } from "../utils/discount-caps";

export type CappedRole = Exclude<UserRole, "owner">;

export interface DiscountCap {
  role: CappedRole;
  maxDiscountPercent: string;
}

// Un valor vacío = sin fila = ese rol no puede dar descuento en la sucursal.
export type DiscountCapForm = Record<CappedRole, string>;

export const useDiscountCaps = (branchId: string | null) => {
  const { apiClient } = useApiClient();
  const [form, setForm] = useState<DiscountCapForm>(capsToForm([]));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCaps = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    // Un error de la API ya lo muestra useApiClient en un toast.
    try {
      const res = await apiClient(`/branches/${branchId}/discount-caps`);
      if (res.ok) setForm(capsToForm(await res.json()));
    } finally {
      setLoading(false);
    }
  }, [apiClient, branchId]);

  useEffect(() => {
    fetchCaps();
  }, [fetchCaps]);

  const setCap = useCallback((role: CappedRole, value: string) => {
    setForm((prev) => ({ ...prev, [role]: value }));
  }, []);

  const save = useCallback(async () => {
    if (!branchId) return;
    setSaving(true);
    try {
      const res = await apiClient(`/branches/${branchId}/discount-caps`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caps: capsToPayload(form) }),
      });
      if (res.ok) setForm(capsToForm(await res.json()));
    } finally {
      setSaving(false);
    }
  }, [apiClient, branchId, form]);

  return { form, loading, saving, setCap, save };
};
