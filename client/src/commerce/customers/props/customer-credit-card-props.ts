export interface CustomerCreditCardProps {
  limit: number;
  balance: number;
  available: number;
  usedPct: number;
  draft: string;
  dirty: boolean;
  saving: boolean;
  onDraftChange: (value: string) => void;
  onSave: () => void;
}
