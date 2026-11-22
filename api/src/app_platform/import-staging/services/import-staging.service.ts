import { singleton, inject } from "tsyringe";
import { randomUUID } from "node:crypto";
import { Decimal } from "decimal.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { PriceListDao } from "../../../commerce/price-list/daos/price-list.dao.js";
import { SupplierDao } from "../../../commerce/suppliers/daos/supplier.dao.js";
import type { RedisLike, StagingRecord, StagingRow } from "../types.js";
import { REDIS_CLIENT } from "../../../core/di/tokens.js";

const TTL_SECONDS = 3600;

@singleton()
export class ImportStagingService {
  constructor(
    @inject(REDIS_CLIENT) private redis: RedisLike,
    private priceListDao: PriceListDao,
    private supplierDao: SupplierDao,
  ) {}

  private key(tenantId: string, importId: string): string {
    return `import_staging:${tenantId}:${importId}`;
  }

  async startUpload(supplierId: string): Promise<{ importId: string; tenantId: string } | null> {
    if (!/^\d+$/.test(supplierId)) return null;
    const supplier = await this.supplierDao.findById(supplierId);
    if (!supplier) return null;

    const tenantId = getCurrentTenantId();
    const importId = randomUUID();
    const record: StagingRecord = {
      importId,
      tenantId,
      supplierId,
      status: "processing",
      rows: [],
      createdAt: new Date().toISOString(),
    };
    await this.redis.set(this.key(tenantId, importId), JSON.stringify(record), "EX", TTL_SECONDS);
    return { importId, tenantId };
  }

  /** Llamado desde el callback de n8n, sin contexto de tenant en el request (sin JWT). */
  async applyCallback(
    tenantId: string,
    importId: string,
    result: { rows: StagingRow[] } | { error: string },
  ): Promise<void> {
    const key = this.key(tenantId, importId);
    const raw = await this.redis.get(key);
    if (!raw) return;
    const record = JSON.parse(raw) as StagingRecord;
    if ("error" in result) {
      record.status = "error";
      record.error = result.error;
    } else {
      record.status = "ready";
      record.rows = result.rows;
    }
    await this.redis.set(key, JSON.stringify(record), "EX", TTL_SECONDS);
  }

  async getById(importId: string): Promise<StagingRecord | null> {
    const tenantId = getCurrentTenantId();
    const raw = await this.redis.get(this.key(tenantId, importId));
    return raw ? (JSON.parse(raw) as StagingRecord) : null;
  }

  async updateRows(importId: string, rows: StagingRow[]): Promise<StagingRecord | null> {
    const tenantId = getCurrentTenantId();
    const key = this.key(tenantId, importId);
    const raw = await this.redis.get(key);
    if (!raw) return null;
    const record = JSON.parse(raw) as StagingRecord;
    record.rows = rows;
    await this.redis.set(key, JSON.stringify(record), "EX", TTL_SECONDS);
    return record;
  }

  async commit(importId: string): Promise<{ imported: number }> {
    const tenantId = getCurrentTenantId();
    const key = this.key(tenantId, importId);
    const raw = await this.redis.get(key);
    if (!raw) throw new Error("Staging de importación no encontrado o expirado");
    const record = JSON.parse(raw) as StagingRecord;
    if (record.status !== "ready") {
      throw new Error("El staging aún no está listo para confirmar");
    }
    if (record.rows.length === 0) {
      throw new Error("No hay filas para importar");
    }

    await this.priceListDao.replaceForSupplier(
      record.supplierId,
      record.rows.map((row) => ({
        brand: row.brand.trim(),
        model: row.model.trim(),
        price: new Decimal(String(row.price)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
      })),
    );
    await this.redis.del(key);
    return { imported: record.rows.length };
  }

  async discard(importId: string): Promise<void> {
    const tenantId = getCurrentTenantId();
    await this.redis.del(this.key(tenantId, importId));
  }
}
