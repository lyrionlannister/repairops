import type { TemplateCatalogEntry } from "../templates/catalog.js";
import { optionalEnv } from "../../../core/config/env.js";

const GRAPH_API_VERSION = optionalEnv("WHATSAPP_GRAPH_API_VERSION", "v21.0");
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export type GraphTemplate = {
  id: string;
  name: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  category: string;
  language: string;
};

export class WhatsappGraphApiError extends Error {
  constructor(message: string, readonly status: number, readonly body: unknown) {
    super(message);
  }
}

async function graphFetch(path: string, accessToken: string, init?: RequestInit): Promise<any> {
  const response = await fetch(`${GRAPH_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new WhatsappGraphApiError(
      body?.error?.message || `Graph API respondió ${response.status}`,
      response.status,
      body,
    );
  }
  return body;
}

export async function listTemplates(
  wabaId: string,
  accessToken: string,
): Promise<GraphTemplate[]> {
  const body = await graphFetch(`/${wabaId}/message_templates?limit=200`, accessToken);
  return body.data ?? [];
}

export async function createTemplate(
  wabaId: string,
  accessToken: string,
  entry: TemplateCatalogEntry,
): Promise<{ id: string; status: string; category: string }> {
  return graphFetch(`/${wabaId}/message_templates`, accessToken, {
    method: "POST",
    body: JSON.stringify({
      name: entry.metaName,
      language: entry.language,
      category: entry.category,
      parameter_format: "NAMED",
      components: [
        {
          type: "BODY",
          text: entry.text,
          example: {
            body_text_named_params: entry.variables.map((name) => ({
              param_name: name,
              example: `ejemplo-${name}`,
            })),
          },
        },
      ],
    }),
  });
}
