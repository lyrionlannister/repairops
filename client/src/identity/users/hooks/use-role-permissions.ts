import { useEffect, useMemo, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import type { UserRole } from "@common/types/auth/permission";
import { grantedPermissions, summarizePermissions } from "../utils/role-permissions";
import type { RoleCatalogEntry } from "../types/role-permissions";

export const useRolePermissions = (roles: readonly UserRole[]) => {
  const { apiClient } = useApiClient();
  const [catalog, setCatalog] = useState<RoleCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient("/auth/roles");
        if (res.ok && !cancelled) setCatalog((await res.json()) as RoleCatalogEntry[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiClient]);

  const summary = useMemo(
    () => summarizePermissions(grantedPermissions(roles, catalog)),
    [roles, catalog],
  );

  return { summary, loading };
};
