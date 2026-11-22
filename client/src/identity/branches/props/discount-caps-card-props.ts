import type { CappedRole, DiscountCapForm } from "../types/discount-caps";

export interface DiscountCapsCardProps {
  form: DiscountCapForm;
  loading: boolean;
  saving: boolean;
  onChange: (role: CappedRole, value: string) => void;
  onSave: () => void;
}
