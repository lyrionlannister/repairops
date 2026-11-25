import { optionalEnv } from "../../core/config/env.js";

const WEBHOOK_URL = optionalEnv(
  "IMPORT_STAGING_WEBHOOK_URL",
  "http://automation:5678/webhook/import-staging",
);
const API_INTERNAL_URL = optionalEnv("API_INTERNAL_URL", "http://api:3000");

/**
 * Dispara el workflow de n8n que mapea columnas con IA y hace staging en Redis.
 * Fire-and-forget desde el controller: n8n avisa el resultado via callback,
 * no se espera la respuesta aqui.
 */
export async function triggerImportStagingWorkflow(params: {
  tenantId: string;
  // public_id del tenant: el workflow lo manda como header
  // X-Tenant-Public-Id en /callback y /progress (esas rutas ya no confían
  // en el tenantId de la URL ni del body).
  tenantPublicId: string;
  importId: string;
  fileName: string;
  fileBuffer: Buffer;
}): Promise<void> {
  const form = new FormData();
  form.set("tenantId", params.tenantId);
  form.set("tenantPublicId", params.tenantPublicId);
  form.set("importId", params.importId);
  form.set("callbackUrl", `${API_INTERNAL_URL}/api/v1/import-staging/callback`);
  form.set("progressUrl", `${API_INTERNAL_URL}/api/v1/import-staging/progress`);
  form.set("internalToken", optionalEnv("N8N_INTERNAL_TOKEN", ""));
  form.set("file", new Blob([new Uint8Array(params.fileBuffer)]), params.fileName);

  const response = await fetch(WEBHOOK_URL, { method: "POST", body: form });
  if (!response.ok) {
    throw new Error(`n8n respondió ${response.status} al disparar import-staging`);
  }
}
