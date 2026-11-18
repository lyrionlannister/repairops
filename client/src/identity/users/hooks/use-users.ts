import { useState, useCallback } from "react";
import { useApiClient } from "../../../core/common/hooks/use-api-client";

export type UserRole = "owner" | "employee" | "technician" | "cashier";
export type PayCycle = "weekly" | "biweekly" | "monthly";

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Dueño",
  employee: "Empleado",
  technician: "Técnico",
  cashier: "Cajero",
};

export const PAY_CYCLE_LABELS: Record<PayCycle, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
};

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  salaryAmount: string;
  payCycle: PayCycle | "";
  branchIds: string[];
  primaryBranchId: string;
}

export interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  salaryAmount: number | null;
  payCycle: PayCycle | null;
  // Sucursales del usuario (vacío para el owner, que accede a todas).
  branchIds: string[];
  primaryBranchId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  salaryAmount?: number;
  payCycle?: PayCycle;
  branchIds?: string[];
  primaryBranchId?: string;
}

// password es opcional: si se omite, el backend debe conservar la contraseña actual.
interface UpdateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  salaryAmount?: number;
  payCycle?: PayCycle;
  branchIds?: string[];
  primaryBranchId?: string;
}

// El owner accede a todas las sucursales: nunca se le asignan branchIds/primaryBranchId.
const toPayload = (form: UserFormData) => ({
  firstName: form.firstName,
  lastName: form.lastName,
  email: form.email,
  role: form.role,
  salaryAmount: form.salaryAmount ? Number(form.salaryAmount) : undefined,
  payCycle: form.payCycle || undefined,
  ...(form.role === "owner" ? {} : { branchIds: form.branchIds, primaryBranchId: form.primaryBranchId || undefined }),
});

export const useUsers = () => {
  const { apiClient } = useApiClient();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient("/auth/users");
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data?.error || "Error al obtener usuarios");
      }
      const data = await response.json() as UserRecord[];
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  // Crea un empleado dentro del tenant actual -- a diferencia de
  // /auth/register (que crea un tenant nuevo cada vez), este endpoint
  // requiere sesion y nunca aisla al usuario creado en otra empresa.
  const createUser = useCallback(async (form: UserFormData): Promise<UserRecord | null> => {
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(false);
    try {
      const payload: CreateUserPayload = { ...toPayload(form), password: form.password };
      const response = await apiClient("/auth/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data?.error || "Error al crear usuario");
      }
      const data = await response.json() as { user: UserRecord };
      setCreateSuccess(true);
      return data.user;
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Error desconocido");
      return null;
    } finally {
      setCreating(false);
    }
  }, [apiClient]);

  const updateUser = useCallback(async (id: string, form: UserFormData): Promise<UserRecord | null> => {
    setUpdating(true);
    setUpdateError(null);
    try {
      // password vacío en edición = no cambiar la contraseña actual.
      const payload: UpdateUserPayload = { ...toPayload(form), ...(form.password ? { password: form.password } : {}) };
      const response = await apiClient(`/auth/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data?.error || "Error al actualizar usuario");
      }
      const data = await response.json() as UserRecord;
      return data;
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Error desconocido");
      return null;
    } finally {
      setUpdating(false);
    }
  }, [apiClient]);

  const toggleUserStatus = useCallback(async (id: string): Promise<void> => {
    setTogglingId(id);
    try {
      const response = await apiClient(`/auth/users/${id}/toggle-status`, {
        method: "PATCH",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data?.error || "Error al cambiar estado del usuario");
      }
      const updated = await response.json() as UserRecord;
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: updated.isActive } : u)));
    } finally {
      setTogglingId(null);
    }
  }, [apiClient]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    creating,
    createError,
    createSuccess,
    clearCreateError: () => setCreateError(null),
    clearCreateSuccess: () => setCreateSuccess(false),
    updateUser,
    updating,
    updateError,
    clearUpdateError: () => setUpdateError(null),
    toggleUserStatus,
    togglingId,
  };
};
