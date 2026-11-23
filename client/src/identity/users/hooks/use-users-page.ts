import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useBranch } from "@common/hooks/use-branch";
import { ALL_BRANCHES } from "@common/contexts/branch-context";
import type { UserRecord } from "../types/users";

export const useUsersPage = (users: UserRecord[]) => {
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const [onlineOnly, setOnlineOnly] = useState(() => searchParams.get("filter") === "online");
  const { activeBranchId } = useBranch();

  const filteredUsers = useMemo(() => {
    // El owner no tiene sucursal propia (ve todas) -- nunca se oculta al filtrar
    // por una sucursal concreta en el header, igual criterio que el resto de la app.
    const byBranch = users.filter(
      (user) =>
        (activeBranchId === ALL_BRANCHES ||
          user.roles.includes("owner") ||
          user.branchIds.includes(activeBranchId)) &&
        (!onlineOnly || user.online),
    );

    const term = search.trim().toLowerCase();
    if (!term) return byBranch;
    return byBranch.filter(
      (user) =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term),
    );
  }, [search, users, activeBranchId, onlineOnly]);

  return { search, setSearch, onlineOnly, setOnlineOnly, filteredUsers };
};
