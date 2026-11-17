import { useState, useCallback } from "react";
import { useApiClient } from "@common/hooks/use-api-client";

export type TicketSize = "58mm" | "80mm" | "letter";

export interface BrandPalette {
  base: string;
  dark: string;
  mid: string;
  footer: string;
  light: string;
  border: string;
  onBrand: string;
}

export interface LocalRecord {
  id: string;
  name?: string;
  address?: string;
  phone?: string;
  logo?: string;
  nextControlNumber: number;
  cashRoundingUnit: number;
  currency: string;
  defaultTicketSize: TicketSize;
  warrantyClause?: string | null;
  brandColor?: string | null;
  timeZone: string;
  brandPalette: BrandPalette;
  taxRatePercent: number;
  maxDiscountPercentByRole: Record<string, number>;
  updatedAt: string;
}

export const useLocal = () => {
  const { apiClient } = useApiClient();
  const [local, setLocal] = useState<LocalRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchLocal = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient("/local");
      if (!response.ok) throw new Error("Error al cargar configuración");
      const data = (await response.json()) as LocalRecord;
      setLocal(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const updateLocal = useCallback(
    async (data: Partial<LocalRecord>): Promise<boolean> => {
      setSaving(true);
      setSaveSuccess(false);
      setError(null);
      try {
        const response = await apiClient("/local", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Error al guardar configuración");
        const updated = (await response.json()) as LocalRecord;
        setLocal(updated);
        setSaveSuccess(true);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [apiClient],
  );

  return { local, loading, saving, saveSuccess, error, fetchLocal, updateLocal };
};
