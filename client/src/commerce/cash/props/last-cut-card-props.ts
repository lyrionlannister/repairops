import type { CashCut } from "../types/cash";

export interface LastCutCardProps {
  cut: CashCut;
  justClosed: boolean;
  onPrint: (id: string) => void;
  onDismiss: () => void;
}
