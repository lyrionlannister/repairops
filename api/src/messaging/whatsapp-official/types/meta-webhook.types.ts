export type MetaWebhookMediaType = "image" | "audio" | "video" | "document" | "sticker";

export interface MetaWebhookMedia {
  id?: string;
  mime_type?: string;
  sha256?: string;
  caption?: string;
}

export interface MetaWebhookLocation {
  latitude?: unknown;
  longitude?: unknown;
  name?: string;
}

export interface MetaWebhookMessage extends Partial<
  Record<MetaWebhookMediaType, MetaWebhookMedia>
> {
  from?: string;
  id?: string;
  type?: string;
  text?: { body?: string };
  location?: MetaWebhookLocation;
}

export interface MetaWebhookContact {
  wa_id?: string;
  profile?: { name?: string };
}

export interface MetaWebhookValue {
  metadata?: { phone_number_id?: string };
  contacts?: MetaWebhookContact[];
  messages?: MetaWebhookMessage[];
}

export interface MetaWebhookPayload {
  entry?: Array<{ changes?: Array<{ value?: MetaWebhookValue }> }>;
}
