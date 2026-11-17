import { createContext } from "react";

export interface BranchRecord {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  // Solo para el personal: su sucursal principal (la activa, no la puede cambiar).
  isPrimary?: boolean;
}

// Valor de activeBranchId cuando el owner mira todas las sucursales juntas.
export const ALL_BRANCHES = "all";

export type BranchContextType = {
  // Solo las sucursales permitidas: el owner recibe todas; el personal, las suyas.
  branches: BranchRecord[];
  // Sucursal que se está viendo. "all" solo existe para el owner.
  activeBranchId: string;
  // Sucursal concreta en la que se registra algo (ventas, notas, caja...). Igual a la activa;
  // si el owner mira "Todas", la última sucursal concreta que eligió (o la primera activa).
  workingBranchId: string;
  // Solo el owner cambia de sucursal; el personal tiene la suya fija.
  canSwitch: boolean;
  setActiveBranchId: (id: string) => void;
  refreshBranches: () => Promise<void>;
};

export const BranchContext = createContext<BranchContextType | undefined>(undefined);
