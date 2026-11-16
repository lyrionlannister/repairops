import { createContext } from "react";

export interface BranchRecord {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
}

export type BranchContextType = {
  branches: BranchRecord[];
  activeBranchId: string;
  setActiveBranchId: (id: string) => void;
  refreshBranches: () => Promise<void>;
};

export const BranchContext = createContext<BranchContextType | undefined>(undefined);

