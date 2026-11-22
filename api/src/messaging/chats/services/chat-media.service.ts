import { createHash } from "node:crypto";
import { singleton, inject } from "tsyringe";
import { MEDIA_STORAGE, type MediaStorage } from "../storage/media-storage.js";
import { downloadMedia, getMediaInfo } from "../../whatsapp-official/clients/whatsapp-graph.client.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";

export const MAX_MEDIA_BYTES = 25 * 1024 * 1024;

// Extension sale del tipo MIME validado, nunca del nombre que manda el cliente.
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/aac": "aac",
  "audio/amr": "amr",
  "video/mp4": "mp4",
  "video/3gpp": "3gp",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/plain": "txt",
};

export interface StoredMediaInfo {
  mediaKey: string;
  mediaMime: string;
  mediaSize: number;
}

export interface IngestMediaInput {
  mediaId: string;
  waMessageId: string;
  contactPhone: string;
  phoneNumberId: string;
  accessToken: string;
}

const baseMime = (mime: string): string => mime.split(";")[0].trim().toLowerCase();

// Baja el archivo de Meta (que solo lo conserva ~30 dias y exige el token de la
// cuenta), lo valida y lo guarda en el almacen. Nunca lanza: ante cualquier
// falla devuelve null y el mensaje queda registrado sin archivo.
@singleton()
export class ChatMediaService {
  constructor(@inject(MEDIA_STORAGE) private storage: MediaStorage) {}

  async ingest(input: IngestMediaInput): Promise<StoredMediaInfo | null> {
    try {
      const info = await getMediaInfo(input.mediaId, input.accessToken);
      const mime = baseMime(info.mimeType);
      const extension = MIME_EXTENSIONS[mime];
      if (!extension) {
        console.warn("Archivo de WhatsApp con tipo no permitido, se registra sin archivo", { mime });
        return null;
      }
      if (info.fileSize !== null && info.fileSize > MAX_MEDIA_BYTES) {
        console.warn("Archivo de WhatsApp demasiado grande, se registra sin archivo", { size: info.fileSize });
        return null;
      }

      const body = await downloadMedia(info.url, input.accessToken, MAX_MEDIA_BYTES);
      if (info.sha256 && createHash("sha256").update(body).digest("hex") !== info.sha256.toLowerCase()) {
        console.warn("Archivo de WhatsApp con sha256 distinto al informado por Meta, se descarta");
        return null;
      }

      // Siempre el tenant del contexto y el wamid: nada del cliente entra a la clave.
      const mediaKey = `tenants/${getCurrentTenantId()}/chat/${input.contactPhone}/${input.waMessageId}.${extension}`;
      await this.storage.put(mediaKey, body, mime);
      return { mediaKey, mediaMime: mime, mediaSize: body.length };
    } catch (error) {
      console.error("No se pudo guardar el archivo de WhatsApp:", error instanceof Error ? error.message : "error desconocido");
      return null;
    }
  }

  async read(mediaKey: string) {
    return this.storage.get(mediaKey);
  }
}
