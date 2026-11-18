import { useState, useCallback } from "react";
import { useApiClient } from "@common/hooks/use-api-client";

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  contactName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SupplierPayload = Pick<Supplier, "name" | "phone" | "email" | "address" | "contactName">;

export interface SupplierFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  contactName: string;
}

export const useSuppliers = () => {
  const { apiClient } = useApiClient();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient("/suppliers");
      if (!res.ok) throw new Error("Error al cargar proveedores");
      setSuppliers(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const create = useCallback(
    async (data: SupplierPayload): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient("/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? "Error al crear proveedor");
        }
        const created: Supplier = await res.json();
        setSuppliers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
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

  const update = useCallback(
    async (id: string, data: SupplierPayload): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient(`/suppliers/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? "Error al actualizar proveedor");
        }
        const updated: Supplier = await res.json();
        setSuppliers((prev) => prev.map((supplier) => (supplier.id === id ? updated : supplier)));
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

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      try {
        const res = await apiClient(`/suppliers/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Error al eliminar proveedor");
        setSuppliers((prev) => prev.filter((supplier) => supplier.id !== id));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        return false;
      }
    },
    [apiClient],
  );

  const setActive = useCallback(
    async (id: string, isActive: boolean): Promise<boolean> => {
      try {
        const res = await apiClient(`/suppliers/${id}/active`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive }),
        });
        if (!res.ok) throw new Error("Error al cambiar el estado del proveedor");
        const updated: Supplier = await res.json();
        setSuppliers((prev) => prev.map((supplier) => (supplier.id === id ? updated : supplier)));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        return false;
      }
    },
    [apiClient],
  );

  return { suppliers, loading, saving, error, fetchAll, create, update, remove, setActive };
};
