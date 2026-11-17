import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatMediaService, MAX_MEDIA_BYTES } from "../../../../src/messaging/chats/services/chat-media.service.js";
import { FsMediaStorage } from "../../../../src/messaging/chats/storage/fs-media-storage.js";
import { OciMediaStorage, type OciObjectClient } from "../../../../src/messaging/chats/storage/oci-media-storage.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";
import * as graph from "../../../../src/messaging/whatsapp-official/clients/whatsapp-graph.client.js";

vi.mock("../../../../src/messaging/whatsapp-official/clients/whatsapp-graph.client.js", () => ({
  getMediaInfo: vi.fn(),
  downloadMedia: vi.fn(),
}));

const file = Buffer.from("contenido-de-la-foto");
const sha = createHash("sha256").update(file).digest("hex");
const input = { mediaId: "m-1", waMessageId: "wamid.IN1", contactPhone: "5215500000000", phoneNumberId: "pn", accessToken: "tok" };

let dir: string;
let storage: FsMediaStorage;
let service: ChatMediaService;

beforeEach(async () => {
  vi.clearAllMocks();
  dir = await mkdtemp(join(tmpdir(), "media-"));
  storage = new FsMediaStorage(dir);
  service = new ChatMediaService(storage);
  vi.mocked(graph.getMediaInfo).mockResolvedValue({ url: "https://m/x", mimeType: "image/jpeg", sha256: sha, fileSize: file.length });
  vi.mocked(graph.downloadMedia).mockResolvedValue(file);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(dir, { recursive: true, force: true });
});

describe("ChatMediaService.ingest", () => {
  it("guarda el archivo con la clave tenants/<tenant>/chat/<telefono>/<wamid>.<ext>", async () => {
    const result = await runWithTenant("42", () => service.ingest(input));

    expect(result).toEqual({ mediaKey: "tenants/42/chat/5215500000000/wamid.IN1.jpg", mediaMime: "image/jpeg", mediaSize: file.length });
    expect(await readFile(join(dir, "tenants/42/chat/5215500000000/wamid.IN1.jpg"))).toEqual(file);
  });

  it("usa el tenant del contexto en la clave, nunca otro", async () => {
    const a = await runWithTenant("1", () => service.ingest(input));
    const b = await runWithTenant("2", () => service.ingest(input));
    expect(a?.mediaKey.startsWith("tenants/1/")).toBe(true);
    expect(b?.mediaKey.startsWith("tenants/2/")).toBe(true);
  });

  it("normaliza un MIME con codecs y deriva la extension del MIME", async () => {
    vi.mocked(graph.getMediaInfo).mockResolvedValue({ url: "u", mimeType: "audio/ogg; codecs=opus", sha256: sha, fileSize: file.length });
    const result = await runWithTenant("1", () => service.ingest(input));
    expect(result?.mediaMime).toBe("audio/ogg");
    expect(result?.mediaKey.endsWith(".ogg")).toBe(true);
  });

  it("rechaza un MIME fuera de la lista sin descargar", async () => {
    vi.mocked(graph.getMediaInfo).mockResolvedValue({ url: "u", mimeType: "application/x-msdownload", sha256: sha, fileSize: 10 });
    expect(await runWithTenant("1", () => service.ingest(input))).toBeNull();
    expect(graph.downloadMedia).not.toHaveBeenCalled();
  });

  it("rechaza un archivo mayor de 25 MB sin descargar", async () => {
    vi.mocked(graph.getMediaInfo).mockResolvedValue({ url: "u", mimeType: "image/jpeg", sha256: sha, fileSize: MAX_MEDIA_BYTES + 1 });
    expect(await runWithTenant("1", () => service.ingest(input))).toBeNull();
    expect(graph.downloadMedia).not.toHaveBeenCalled();
  });

  it("rechaza un sha256 que no coincide y no guarda nada", async () => {
    vi.mocked(graph.getMediaInfo).mockResolvedValue({ url: "u", mimeType: "image/jpeg", sha256: "0".repeat(64), fileSize: file.length });
    expect(await runWithTenant("1", () => service.ingest(input))).toBeNull();
    expect(await storage.get("tenants/1/chat/5215500000000/wamid.IN1.jpg")).toBeNull();
  });

  it("una falla de descarga devuelve null y no lanza", async () => {
    vi.mocked(graph.downloadMedia).mockRejectedValue(new Error("Meta caido"));
    await expect(runWithTenant("1", () => service.ingest(input))).resolves.toBeNull();
  });

  it("una falla de subida devuelve null y no lanza", async () => {
    vi.spyOn(storage, "put").mockRejectedValue(new Error("bucket caido"));
    await expect(runWithTenant("1", () => service.ingest(input))).resolves.toBeNull();
  });

  it("no escribe llaves ni tokens en los logs al fallar", async () => {
    vi.mocked(graph.downloadMedia).mockRejectedValue(new Error("fallo"));
    await runWithTenant("1", () => service.ingest(input));
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("tok");
  });
});

describe("FsMediaStorage", () => {
  it("ida y vuelta, borrado y 404 como null", async () => {
    await storage.put("a/b.bin", Buffer.from("x"), "image/png");
    expect(await storage.get("a/b.bin")).toEqual({ body: Buffer.from("x"), contentType: "image/png" });
    await storage.delete("a/b.bin");
    expect(await storage.get("a/b.bin")).toBeNull();
  });

  it("una clave no puede escapar de la raiz", async () => {
    await expect(storage.put("../fuera.bin", Buffer.from("x"), "x/y")).rejects.toThrow("inválida");
  });
});

describe("OciMediaStorage", () => {
  function fakeClient() {
    const objects = new Map<string, { body: Buffer; contentType: string }>();
    const client: OciObjectClient = {
      putObject: vi.fn(async (r) => void objects.set(r.objectName, { body: r.putObjectBody, contentType: r.contentType })),
      getObject: vi.fn(async (r) => {
        const found = objects.get(r.objectName);
        if (!found) throw Object.assign(new Error("not found"), { statusCode: 404 });
        return { value: found.body, contentType: found.contentType };
      }),
      deleteObject: vi.fn(async (r) => void objects.delete(r.objectName)),
    };
    return client;
  }

  it("usa el namespace y el bucket configurados", async () => {
    const client = fakeClient();
    const oci = new OciMediaStorage(client, "ns", "bk");
    await oci.put("k", Buffer.from("hola"), "image/png");

    expect(client.putObject).toHaveBeenCalledWith(
      expect.objectContaining({ namespaceName: "ns", bucketName: "bk", objectName: "k", contentLength: 4, contentType: "image/png" }),
    );
    expect(await oci.get("k")).toEqual({ body: Buffer.from("hola"), contentType: "image/png" });
    await oci.delete("k");
    expect(await oci.get("k")).toBeNull();
  });

  it("propaga errores que no son 404", async () => {
    const client = fakeClient();
    vi.mocked(client.getObject).mockRejectedValue(Object.assign(new Error("boom"), { statusCode: 500 }));
    await expect(new OciMediaStorage(client, "ns", "bk").get("k")).rejects.toThrow("boom");
  });
});
