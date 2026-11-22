import type { RegisterPaymentForm } from "../types/register-payment-modal";

export interface RegisterPaymentModalProps {
  isOpen: boolean;
  form: RegisterPaymentForm;
  balance: number;
  saving: boolean;
  error: string | null;
  onFormChange: (updater: (prev: RegisterPaymentForm) => RegisterPaymentForm) => void;
  onClose: () => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
}
