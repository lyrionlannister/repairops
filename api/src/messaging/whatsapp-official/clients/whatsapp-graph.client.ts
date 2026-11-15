import { optionalEnv } from "../../../core/config/env.js";

// Shape minimo que este cliente necesita para hablar con Meta -- no depende
// de donde vive el catalogo (antes templates/catalog.ts, ahora
// WhatsappTemplateCatalogEntry, ver plan Fase 4 Checkpoint 7). Cualquier
// objeto con estos campos (el arreglo viejo o la Entity nueva) encaja.
export type TemplateDefinition = {
  metaName: string;
  category: string;
  language: string;
  text: string;
  variables: string[];
};

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

// Editar una plantilla ya creada en Meta reinicia su revision (vuelve a
// PENDING) -- el caller (WhatsappTemplateCatalogService.update) es quien
// refleja eso en WhatsappTemplateStatus, este cliente solo habla con Meta.
export async function updateTemplate(
  metaTemplateId: string,
  accessToken: string,
  entry: TemplateDefinition,
): Promise<{ success: boolean }> {
  return graphFetch(`/${metaTemplateId}`, accessToken, {
    method: "POST",
    body: JSON.stringify({
      category: entry.category,
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

export async function deleteTemplate(
  wabaId: string,
  accessToken: string,
  metaName: string,
): Promise<{ success: boolean }> {
  return graphFetch(`/${wabaId}/message_templates?name=${encodeURIComponent(metaName)}`, accessToken, {
    method: "DELETE",
  });
}

export async function createTemplate(
  wabaId: string,
  accessToken: string,
  entry: TemplateDefinition,
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

export async function sendTextMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  body: string,
): Promise<{ messages: Array<{ id: string }> }> {
  return graphFetch(`/${phoneNumberId}/messages`, accessToken, {
    method: "POST",
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });
}

// Valida credenciales de una cuenta propia por taller (ver plan Fase 4,
// Checkpoint 6) ANTES de guardarlas: confirma que el token tiene permiso
// sobre phoneNumberId y acceso al wabaId dado, sin persistir nada todavia.
export async function verifyAccountCredentials(
  wabaId: string,
  phoneNumberId: string,
  accessToken: string,
): Promise<void> {
  const phoneCheck = await graphFetch(`/${phoneNumberId}?fields=id`, accessToken);
  if (phoneCheck.id !== phoneNumberId) {
    throw new WhatsappGraphApiError(
      "El token no tiene permiso sobre ese phoneNumberId",
      403,
      phoneCheck,
    );
  }
  await listTemplates(wabaId, accessToken);
}

export async function sendTemplateMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  entry: TemplateDefinition,
  variables: Record<string, string>,
): Promise<{ messages: Array<{ id: string }> }> {
  return graphFetch(`/${phoneNumberId}/messages`, accessToken, {
    method: "POST",
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: entry.metaName,
        language: { code: entry.language },
        components: [
          {
            type: "body",
            parameters: entry.variables.map((name) => ({
              type: "text",
              parameter_name: name,
              text: variables[name] ?? "",
            })),
          },
        ],
      },
    }),
  });
}
