export interface MessageTemplate {
  id: string;
  key: string;
  text: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageTemplateFormData {
  key: string;
  text: string;
  description: string;
}
