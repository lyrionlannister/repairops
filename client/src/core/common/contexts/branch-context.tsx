import { createContext } from "react";
import type { BranchContextType } from "../types/branch-context";

// Valor de activeBranchId cuando el owner mira todas las sucursales juntas.
export const ALL_BRANCHES = "all";
export const BranchContext = createContext<BranchContextType | undefined>(undefined);
