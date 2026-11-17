import { useState, useCallback } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import { useBranchQuery } from "../../../core/common/hooks/use-branch-query";

export type RepairNoteStatus = "received" | "in_repair" | "done" | "delivered" | "cancelled";

export interface RepairNoteRecord {
  id: string;
  controlNumber: number;
  publicRef: string;
  // URL wa.me del QR impreso; la arma el API. null si el taller no tiene numero de WhatsApp.
  whatsappQrUrl?: string | null;
  customerName: string;
  contactNumber?: string;
  brand: string;
  model: string;
  reportedFailure: string;
  totalValue: number;
  status: RepairNoteStatus;
  requiresAdvance: boolean;
  advanceValue?: number;
  receivedAt: string;
  deliveryDate?: string;
  technicianNotes?: string;
  additionalFindings?: string;
  assignedEmployeeId?: string | null;
  localId?: string | null;
  customerId?: string | null;
  deviceOff: boolean;
  hasWarranty: boolean;
  hasExtendedWarranty: boolean;
  extendedWarrantyDays?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RepairNoteFormData {
  customerName: string;
  contactNumber: string;
  brand: string;
  model: string;
  reportedFailure: string;
  totalValue: string;
  status: RepairNoteStatus;
  requiresAdvance: boolean;
  advanceValue: string;
  receivedAt: string;
  deliveryDate: string;
  technicianNotes: string;
  additionalFindings: string;
  assignedEmployeeId: string;
  localId: string;
  customerId: string;
  serviceTypeIds: string[];
  deviceOff: boolean;
  hasWarranty: boolean;
  hasExtendedWarranty: boolean;
  extendedWarrantyDays: string;
}

export const INITIAL_FORM: RepairNoteFormData = {
  customerName: "",
  contactNumber: "",
  brand: "",
  model: "",
  reportedFailure: "",
  totalValue: "0",
  status: "received",
  requiresAdvance: false,
  advanceValue: "",
  receivedAt: new Date().toISOString().split("T")[0],
  deliveryDate: "",
  technicianNotes: "",
  additionalFindings: "",
  assignedEmployeeId: "",
  localId: "",
  customerId: "",
  serviceTypeIds: [],
  deviceOff: false,
  hasWarranty: false,
  hasExtendedWarranty: false,
  extendedWarrantyDays: "",
};

export const STATUS_CONFIG: Record<RepairNoteStatus, { label: string; className: string }> = {
  received: {
    label: "Recibido",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  in_repair: {
    label: "En Reparación",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  done: {
    label: "Listo",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  delivered: {
    label: "Entregado",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

export interface RepairNoteItemInput {
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
}

export interface RepairNoteItemRecord extends RepairNoteItemInput {
  id: string;
}

const toPayload = (form: RepairNoteFormData) => ({
  ...form,
  totalValue: parseFloat(form.totalValue) || 0,
  advanceValue: form.advanceValue ? parseFloat(form.advanceValue) : undefined,
  extendedWarrantyDays: form.extendedWarrantyDays
    ? parseInt(form.extendedWarrantyDays, 10)
    : undefined,
  deliveryDate: form.deliveryDate || undefined,
  contactNumber: form.contactNumber || undefined,
  technicianNotes: form.technicianNotes || undefined,
  additionalFindings: form.additionalFindings || undefined,
  assignedEmployeeId: form.assignedEmployeeId || undefined,
  localId: form.localId || undefined,
  customerId: form.customerId || undefined,
});

export const useRepairNotes = () => {
  const { apiClient } = useApiClient();
  const [notes, setNotes] = useState<RepairNoteRecord[]>([]);
  const [note, setNote] = useState<RepairNoteRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const branchQuery = useBranchQuery();

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient(`/repair-notes${branchQuery}`);
      if (!response.ok) throw new Error("Error al obtener notas");
      const data = (await response.json()) as RepairNoteRecord[];
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [apiClient, branchQuery]);

  const fetchNote = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient(`/repair-notes/${id}`);
        if (!response.ok) throw new Error("Error al obtener nota");
        const data = (await response.json()) as RepairNoteRecord;
        setNote(data);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiClient],
  );

  const createNote = useCallback(
    async (form: RepairNoteFormData, items?: RepairNoteItemInput[]): Promise<RepairNoteRecord | null> => {
      setSaving(true);
      setError(null);
      try {
        const response = await apiClient("/repair-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...toPayload(form), items }),
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data?.error || "Error al crear nota");
        }
        return (await response.json()) as RepairNoteRecord;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [apiClient],
  );

  const updateNote = useCallback(
    async (
      id: string,
      form: RepairNoteFormData,
      items?: RepairNoteItemInput[],
    ): Promise<RepairNoteRecord | null> => {
      setSaving(true);
      setError(null);
      try {
        const response = await apiClient(`/repair-notes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(items !== undefined ? { ...toPayload(form), items } : toPayload(form)),
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data?.error || "Error al actualizar nota");
        }
        return (await response.json()) as RepairNoteRecord;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [apiClient],
  );

  const fetchNoteItems = useCallback(
    async (id: string): Promise<RepairNoteItemRecord[]> => {
      try {
        const response = await apiClient(`/repair-notes/${id}/items`);
        if (!response.ok) return [];
        return (await response.json()) as RepairNoteItemRecord[];
      } catch {
        return [];
      }
    },
    [apiClient],
  );

  const fetchNoteServiceTypeIds = useCallback(
    async (id: string): Promise<string[]> => {
      try {
        const response = await apiClient(`/repair-notes/${id}/service-types`);
        if (!response.ok) return [];
        return (await response.json()) as string[];
      } catch {
        return [];
      }
    },
    [apiClient],
  );

  const cancelNote = useCallback(
    async (id: string): Promise<RepairNoteRecord | null> => {
      setError(null);
      try {
        const response = await apiClient(`/repair-notes/${id}/cancel`, {
          method: "POST",
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data?.error || "Error al cancelar nota");
        }
        const updated = (await response.json()) as RepairNoteRecord;
        setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        return null;
      }
    },
    [apiClient],
  );

  const deleteNote = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response = await apiClient(`/repair-notes/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Error al eliminar nota");
        setNotes((prev) => prev.filter((n) => n.id !== id));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        return false;
      }
    },
    [apiClient],
  );

  return {
    notes,
    note,
    loading,
    saving,
    error,
    fetchNotes,
    fetchNote,
    fetchNoteItems,
    fetchNoteServiceTypeIds,
    createNote,
    updateNote,
    cancelNote,
    deleteNote,
    clearError: () => setError(null),
  };
};
