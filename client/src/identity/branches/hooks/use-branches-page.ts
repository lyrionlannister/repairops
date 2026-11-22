import { useMemo, useState } from "react";
import type { Branch } from "../types/branches";

export const useBranchesPage = (branches: Branch[]) => {
  const [search, setSearch] = useState("");

  const filteredBranches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return branches;
    return branches.filter(
      (branch) =>
        branch.name.toLowerCase().includes(term) ||
        (branch.phone ?? "").toLowerCase().includes(term) ||
        (branch.address ?? "").toLowerCase().includes(term),
    );
  }, [search, branches]);

  return { search, setSearch, filteredBranches };
};
