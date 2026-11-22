import { useCallback, useEffect, useMemo, useState } from "react";
import { useApiClient } from "../../hooks/use-api-client";
import { usePermissions } from "../../hooks/use-permissions";
import { ALL_BRANCHES, BranchContext } from "../branch-context";
import type { BranchRecord } from "../../types/branch-context";

const STORAGE_KEY = "activeBranchId";

// Única fuente de la sucursal activa del cliente. El API es quien valida (cualquier
// branchId que mande el cliente se comprueba contra el tenant y el alcance del usuario);
// este contexto solo evita que cada pantalla decida por su cuenta.
export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { apiClient } = useApiClient();
  const { isOwner } = usePermissions();
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [activeBranchId, setActiveBranchIdState] = useState<string>(
    () => sessionStorage.getItem(STORAGE_KEY) ?? "",
  );
  const [lastSpecificBranchId, setLastSpecificBranchId] = useState<string>("");

  const setActiveBranchId = useCallback(
    (id: string) => {
      if (!isOwner) return;
      setActiveBranchIdState(id);
      sessionStorage.setItem(STORAGE_KEY, id);
      if (id !== ALL_BRANCHES) setLastSpecificBranchId(id);
    },
    [isOwner],
  );

  const refreshBranches = useCallback(async () => {
    try {
      const res = await apiClient("/branches");
      if (!res.ok) return;
      const data = (await res.json()) as BranchRecord[];
      setBranches(data);

      const active = data.filter((b) => b.isActive);
      setActiveBranchIdState((prev) => {
        // Personal: siempre su sucursal principal, sin importar lo guardado.
        if (!isOwner) {
          const own = active.find((b) => b.isPrimary)?.id ?? active[0]?.id ?? "";
          sessionStorage.setItem(STORAGE_KEY, own);
          return own;
        }
        // Owner: lo guardado si sigue siendo válido; si no, todas (o la única que hay).
        if (prev === ALL_BRANCHES && active.length > 1) return prev;
        if (prev && data.some((b) => b.id === prev)) return prev;
        const fallback = active.length > 1 ? ALL_BRANCHES : (active[0]?.id ?? data[0]?.id ?? "");
        if (fallback) sessionStorage.setItem(STORAGE_KEY, fallback);
        return fallback;
      });
    } catch {
      // noop: la app sigue usable, solo sin selector de sucursal poblado
    }
  }, [apiClient, isOwner]);

  useEffect(() => {
    refreshBranches();
  }, [refreshBranches]);

  const value = useMemo(() => {
    const firstActive = branches.find((b) => b.isActive)?.id ?? branches[0]?.id ?? "";
    const workingBranchId =
      activeBranchId !== ALL_BRANCHES && activeBranchId
        ? activeBranchId
        : lastSpecificBranchId && branches.some((b) => b.id === lastSpecificBranchId)
          ? lastSpecificBranchId
          : firstActive;
    return { branches, activeBranchId, workingBranchId, canSwitch: isOwner, setActiveBranchId, refreshBranches };
  }, [branches, activeBranchId, lastSpecificBranchId, isOwner, setActiveBranchId, refreshBranches]);

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
};
