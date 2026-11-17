import { optionalEnv, requiredEnv } from "../../../core/config/env.js";
import type { MediaStorage } from "./media-storage.js";
import { FsMediaStorage } from "./fs-media-storage.js";
import { OciMediaStorage, createOciClient } from "./oci-media-storage.js";

// MEDIA_STORAGE=fs (default, desarrollo y pruebas) | oci (produccion). Cambiar de
// uno a otro solo toca la configuracion.
export function createMediaStorage(): MediaStorage {
  if (optionalEnv("MEDIA_STORAGE", "fs") === "oci") {
    const namespace = requiredEnv("OCI_NAMESPACE");
    const bucket = requiredEnv("OCI_BUCKET");
    const client = createOciClient({
      region: requiredEnv("OCI_REGION"),
      namespace,
      bucket,
      tenancyOcid: requiredEnv("OCI_TENANCY_OCID"),
      userOcid: requiredEnv("OCI_USER_OCID"),
      fingerprint: requiredEnv("OCI_FINGERPRINT"),
      privateKey: requiredEnv("OCI_PRIVATE_KEY"),
    });
    return new OciMediaStorage(client, namespace, bucket);
  }
  return new FsMediaStorage(optionalEnv("MEDIA_STORAGE_DIR", "./media-storage"));
}
