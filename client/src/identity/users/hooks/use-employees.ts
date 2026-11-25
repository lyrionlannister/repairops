import { useState, useCallback } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import { usePermissions } from "@common/hooks/use-permissions";
import type { EmployeeOption } from "../types/employees";
import { readApiError } from "@common/utils/api-error";

export const useEmployees = () => {
  const { apiClient } = useApiClient();
  const { can } = usePermissions();
  // El técnico no ve la lista de personal (staff.list): sus notas quedan asignadas a él.
  const canList = can("staff.list");
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!canList) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient("/auth/employees");
      if (!res.ok) throw new Error(await readApiError(res, "Error al cargar empleados"));
      setEmployees(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [apiClient, canList]);

  return { employees, loading, error, fetchAll };
};
