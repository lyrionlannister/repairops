export interface StoredMedia {
  body: Buffer;
  contentType: string;
}

// Interfaz propia sobre el almacen de archivos del chat: cambiar de proveedor
// (OCI, S3, disco) no toca el resto del codigo.
export interface MediaStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<StoredMedia | null>;
  delete(key: string): Promise<void>;
}

export const MEDIA_STORAGE = "MEDIA_STORAGE";
