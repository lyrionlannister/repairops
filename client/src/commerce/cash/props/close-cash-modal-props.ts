export interface CloseCashModalProps {
  isOpen: boolean;
  closingBalance: string;
  closeReason: string;
  closeAuthorizedByEmployeeId: string;
  showCloseReasonField: boolean;
  showCloseAuthorizerField: boolean;
  saving: boolean;
  onClosingBalanceChange: (value: string) => void;
  onCloseReasonChange: (value: string) => void;
  onCloseAuthorizedByEmployeeIdChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
}
