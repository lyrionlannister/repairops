import { useBranch } from "./use-branch";
import { ALL_BRANCHES } from "../contexts/branch-context";

// Parámetro de sucursal para los listados: "?branchId=3" cuando se mira una sucursal
// concreta, y nada cuando el owner mira "Todas". El personal no necesita mandarlo: el API
// ya lo acota a su sucursal; igualmente se manda la suya y el API lo valida.
export const useBranchQuery = (): string => {
  const { activeBranchId } = useBranch();
  return activeBranchId && activeBranchId !== ALL_BRANCHES ? `?branchId=${encodeURIComponent(activeBranchId)}` : "";
};

// Mismo criterio que useBranchQuery, como valor de filtro para useServerList.
export const useBranchFilter = (): string | undefined => {
  const { activeBranchId } = useBranch();
  return activeBranchId && activeBranchId !== ALL_BRANCHES ? activeBranchId : undefined;
};
