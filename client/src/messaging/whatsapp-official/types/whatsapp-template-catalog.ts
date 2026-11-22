export interface WhatsappTemplateCatalogEntryRow {
  id: string;
  key: string;
  metaName: string;
  category: WhatsappTemplateCategory;
  language: string;
  text: string;
  variables: string[];
  triggerEvent: string | null;
  enabled: boolean;
}

export interface CreateWhatsappTemplateCatalogEntryInput {
  key: string;
  metaName: string;
  category: WhatsappTemplateCategory;
  language: string;
  text: string;
  variables: string[];
}

export interface UpdateWhatsappTemplateCatalogEntryInput {
  text?: string;
  variables?: string[];
  enabled?: boolean;
}

export type WhatsappTemplateCategory = "UTILITY" | "MARKETING" | "AUTHENTICATION";
