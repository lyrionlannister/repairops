import type { ConnectAccountForm } from "../types/connect-account-modal";

export interface ConnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: ConnectAccountForm;
  onFormChange: (form: ConnectAccountForm) => void;
  connecting: boolean;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
}
