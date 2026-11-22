import type { MessageTemplateFormData } from "../types/message-templates";

export interface MessageTemplateFormProps {
  form: MessageTemplateFormData;
  loading: boolean;
  saving: boolean;
  isEdit: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}
