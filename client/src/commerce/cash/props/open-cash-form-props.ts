export interface OpenCashFormProps {
  openingBalance: string;
  suggestedBalance: string | null;
  openerName: string;
  saving: boolean;
  onOpeningBalanceChange: (value: string) => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
}
