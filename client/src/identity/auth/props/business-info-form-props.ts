import type { ChangeEventHandler, FormEventHandler } from "react";
import type { BusinessInfoForm } from "../types/onboarding-business";

export interface BusinessInfoFormProps {
  form: BusinessInfoForm;
  saving: boolean;
  error: string | null;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onSubmit: FormEventHandler<HTMLFormElement>;
}
