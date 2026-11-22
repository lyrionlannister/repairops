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
  status: string;
  category: string;
  language: string;
};

export class WhatsappGraphApiError extends Error {
  constructor(message: string, readonly status: number, readonly body: unknown) {
    super(message);
  }
}

type GraphErrorBody = { error?: { message?: string } } | null;

async function graphFetch<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${GRAPH_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new WhatsappGraphApiError(
      (body as GraphErrorBody)?.error?.message || `Graph API respondió ${response.status}`,
      response.status,
      body,
    );
  }
  return body as T;
}

export async function listTemplates(
  wabaId: string,
  accessToken: string,
): Promise<GraphTemplate[]> {
  const body = await graphFetch<{ data?: GraphTemplate[] }>(`/${wabaId}/message_templates?limit=200`, accessToken);
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
// Numero visible de la cuenta (ej. "+52 1 55 1234 5678") reducido a digitos: es lo que
// va en https://wa.me/<numero>. Falla con claridad si Meta no lo devuelve.
export async function getDisplayPhoneNumber(phoneNumberId: string, accessToken: string): Promise<string> {
  const body = await graphFetch<{ display_phone_number?: string } | null>(
    `/${phoneNumberId}?fields=display_phone_number`,
    accessToken,
  );
  const digits = String(body?.display_phone_number ?? "").replace(/\D/g, "");
  if (!digits) {
    throw new WhatsappGraphApiError("Meta no devolvió display_phone_number para la cuenta", 502, body);
  }
  return digits;
}

export async function verifyAccountCredentials(
  wabaId: string,
  phoneNumberId: string,
  accessToken: string,
): Promise<void> {
  const phoneCheck = await graphFetch<{ id?: string } | null>(`/${phoneNumberId}?fields=id`, accessToken);
  if (phoneCheck?.id !== phoneNumberId) {
    throw new WhatsappGraphApiError(
      "El token no tiene permiso sobre ese número de WhatsApp",
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

type GraphMediaBody = { url?: string; mime_type?: string; sha256?: string; file_size?: number | string };

export interface MediaInfo {
  url: string;
  mimeType: string;
  sha256: string | null;
  fileSize: number | null;
}

// GET /{media-id} devuelve una URL temporal; la descarga exige el mismo token.
export async function getMediaInfo(mediaId: string, accessToken: string): Promise<MediaInfo> {
  const body = await graphFetch<GraphMediaBody | null>(`/${mediaId}`, accessToken);
  if (!body?.url || !body?.mime_type) {
    throw new WhatsappGraphApiError("Meta no devolvió la URL del archivo", 502, null);
  }
  return {
    url: String(body.url),
    mimeType: String(body.mime_type),
    sha256: body.sha256 ? String(body.sha256) : null,
    fileSize: body.file_size != null ? Number(body.file_size) : null,
  };
}

// Descarga con tope de bytes: aborta en cuanto se pasa, sin cargar todo en memoria.
export async function downloadMedia(url: string, accessToken: string, maxBytes: number): Promise<Buffer> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) {
    throw new WhatsappGraphApiError(`La descarga del archivo respondió ${response.status}`, response.status, null);
  }
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new WhatsappGraphApiError("Archivo demasiado grande", 413, null);
  const chunks: Buffer[] = [];
  let received = 0;
  for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
    received += chunk.length;
    if (received > maxBytes) throw new WhatsappGraphApiError("Archivo demasiado grande", 413, null);
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
