import type { PlanOption, SubscriptionFormData } from "../types/platform-tenants";

export interface SubscriptionFormProps {
  form: SubscriptionFormData;
  plans: PlanOption[];
  disabled: boolean;
  onChange: (field: keyof SubscriptionFormData, value: string) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}
