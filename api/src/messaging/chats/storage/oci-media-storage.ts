import * as objectStorage from "oci-objectstorage";
import * as common from "oci-common";
import type { MediaStorage, StoredMedia } from "./media-storage.js";

// Lo minimo que se usa del cliente del SDK; las pruebas inyectan un doble.
export interface OciObjectClient {
  putObject(request: {
    namespaceName: string;
    bucketName: string;
    objectName: string;
    putObjectBody: Buffer;
    contentLength: number;
    contentType: string;
  }): Promise<unknown>;
  getObject(request: { namespaceName: string; bucketName: string; objectName: string }): Promise<{
    value: unknown;
    contentType?: string;
  }>;
  deleteObject(request: { namespaceName: string; bucketName: string; objectName: string }): Promise<unknown>;
}

export interface OciMediaStorageConfig {
  region: string;
  namespace: string;
  bucket: string;
  tenancyOcid: string;
  userOcid: string;
  fingerprint: string;
  privateKey: string;
}

export function createOciClient(config: OciMediaStorageConfig): OciObjectClient {
  const provider = new common.SimpleAuthenticationDetailsProvider(
    config.tenancyOcid,
    config.userOcid,
    config.fingerprint,
    // La llave suele pegarse en una sola linea con "\n" literales.
    config.privateKey.replace(/\\n/g, "\n"),
    null,
    common.Region.fromRegionId(config.region),
  );
  return new objectStorage.ObjectStorageClient({ authenticationDetailsProvider: provider });
}

async function toBuffer(value: unknown): Promise<Buffer> {
  if (Buffer.isBuffer(value)) return value;
  const chunks: Buffer[] = [];
  for await (const chunk of value as AsyncIterable<Uint8Array>) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

// Bucket privado: nada se expone por URL, todo pasa por el API. Ni las llaves
// ni el contenido se escriben en los logs.
export class OciMediaStorage implements MediaStorage {
  constructor(
    private readonly client: OciObjectClient,
    private readonly namespace: string,
    private readonly bucket: string,
  ) {}

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.putObject({
      namespaceName: this.namespace,
      bucketName: this.bucket,
      objectName: key,
      putObjectBody: body,
      contentLength: body.length,
      contentType,
    });
  }

  async get(key: string): Promise<StoredMedia | null> {
    try {
      const response = await this.client.getObject({ namespaceName: this.namespace, bucketName: this.bucket, objectName: key });
      return { body: await toBuffer(response.value), contentType: response.contentType ?? "application/octet-stream" };
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.deleteObject({ namespaceName: this.namespace, bucketName: this.bucket, objectName: key });
  }
}
