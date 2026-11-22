export interface OpenCashFormProps {
  openingBalance: string;
  openedByEmployeeId: string;
  saving: boolean;
  onOpeningBalanceChange: (value: string) => void;
  onOpenedByEmployeeIdChange: (value: string) => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
}
