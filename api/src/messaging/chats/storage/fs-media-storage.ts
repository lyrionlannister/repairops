import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import type { MediaStorage, StoredMedia } from "./media-storage.js";
import { BusinessError } from "../../../core/http/business-error.js";

export class FsMediaStorage implements MediaStorage {
  private readonly root: string;

  constructor(root: string) {
    this.root = resolve(root);
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    const path = this.pathOf(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
    await writeFile(`${path}.type`, contentType);
  }

  async get(key: string): Promise<StoredMedia | null> {
    const path = this.pathOf(key);
    try {
      const [body, contentType] = await Promise.all([
        readFile(path),
        readFile(`${path}.type`, "utf8"),
      ]);
      return { body, contentType };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const path = this.pathOf(key);
    await rm(path, { force: true });
    await rm(`${path}.type`, { force: true });
  }

  // Una clave nunca puede escapar de la raiz.
  private pathOf(key: string): string {
    const path = resolve(join(this.root, key));
    if (!path.startsWith(this.root + sep)) throw new BusinessError("Clave de archivo inválida");
    return path;
  }
}
