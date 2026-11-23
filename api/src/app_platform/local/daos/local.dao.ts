import { isRowsTuple } from "../../../core/database/rows-result.js";
import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { Local } from "../entities/local.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

export type FolioKind = "control" | "sale" | "return" | "quote" | "cut" | "count";

export const FOLIOS: Readonly<Record<FolioKind, { counter: string; table: string; column: string }>> = {
  control: { counter: "siguiente_numero_control", table: "repair_notes", column: "numero_control" },
  sale: { counter: "siguiente_numero_venta", table: "sales", column: "numero_venta" },
  return: { counter: "siguiente_numero_devolucion", table: "returns", column: "numero_devolucion" },
  quote: { counter: "siguiente_numero_cotizacion", table: "quotes", column: "numero_cotizacion" },
  cut: { counter: "siguiente_numero_corte", table: "cash_sessions", column: "numero_corte" },
  count: { counter: "siguiente_numero_conteo", table: "inventory_counts", column: "numero_conteo" },
};

@singleton()
export class LocalDao extends TenantScopedDao<Local> {
  constructor(@inject(repositoryToken(Local)) repository: Repository<Local>) {
    super(repository);
  }

  // Dedicated queryRunner per raw query so this grabs its own connection
  // from the pool — repository.query() alone can silently queue concurrent
  // calls on a single shared client instead of pooling.
  //
  // queryRunner.query() does NOT return a consistent shape: for this same
  // Postgres driver, an INSERT ... RETURNING resolves to the rows array
  // directly, while an UPDATE ... RETURNING resolves to a [rows, rowCount]
  // tuple — confirmed empirically, not documented. Normalize both here
  // instead of assuming one shape per call site.
  private async runQuery<T>(sql: string, params: unknown[]): Promise<T[]> {
    const queryRunner = this.repository.manager.connection.createQueryRunner();
    try {
      const result = (await queryRunner.query(sql, params)) as T[] | [T[], number];
      return isRowsTuple(result) ? result[0] : result;
    } finally {
      await queryRunner.release();
    }
  }

  async findOrCreate(): Promise<Local> {
    // Upsert atomico: dos llamadas concurrentes para el mismo tenant (p.ej.
    // dos consumeControlNumber() a la vez con el local aun no creado) no
    // deben insertar dos filas y chocar contra el unique(tenant_id) -- el
    // SELECT-then-INSERT que tenia antes sí corria esa carrera.
    const tenantId = this.currentTenantId();
    const rows = await this.runQuery<Partial<Local>>(
      `INSERT INTO local_config ("tenant_id", "siguiente_numero_control")
       VALUES ($1, 1)
       ON CONFLICT ("tenant_id") DO UPDATE SET "tenant_id" = EXCLUDED."tenant_id"
       RETURNING
         "id" AS id,
         "public_id" AS "publicId",
         "tenant_id" AS "tenantId",
         "nombre" AS name,
         "direccion" AS address,
         "telefono" AS phone,
         "logo" AS logo,
         "siguiente_numero_control" AS "nextControlNumber",
         "siguiente_numero_venta" AS "nextSaleNumber",
         "siguiente_numero_devolucion" AS "nextReturnNumber",
         "siguiente_numero_cotizacion" AS "nextQuoteNumber",
         "siguiente_numero_corte" AS "nextCutNumber",
         "siguiente_numero_conteo" AS "nextCountNumber",
         "unidad_redondeo_caja" AS "cashRoundingUnit",
         "tope_diferencia_caja_sin_autorizar" AS "maxUnauthorizedCashVariance",
         "moneda" AS "currency",
         "formato_ticket" AS "defaultTicketSize",
         "clausula_garantia" AS "warrantyClause",
         "color_marca" AS "brandColor",
         "zona_horaria" AS "timeZone",
         "tasa_impuesto" AS "taxRatePercent",
         "fecha_creacion" AS "createdAt",
         "fecha_actualizacion" AS "updatedAt"`,
      [tenantId],
    );
    return this.repository.create(rows[0]);
  }

  // UPDATE ... RETURNING atomico: dos consumos concurrentes nunca reciben el mismo folio.
  async consume(folio: FolioKind): Promise<number> {
    const local = await this.findOrCreate();
    const { counter } = FOLIOS[folio];
    const rows = await this.runQuery<{ number: number }>(
      `UPDATE local_config SET "${counter}" = "${counter}" + 1
       WHERE "id" = $1
       RETURNING "${counter}" - 1 AS number`,
      [local.id],
    );
    return rows[0].number;
  }

  // Ultimo folio asignado de cada documento: el siguiente configurable nunca puede ser
  // menor o igual (chocaria con el UNIQUE(tenant_id, folio) del documento).
  async lastUsedFolios(): Promise<Record<FolioKind, number>> {
    const selects = (Object.keys(FOLIOS) as FolioKind[])
      .map((kind) => {
        const { table, column } = FOLIOS[kind];
        return `(SELECT COALESCE(MAX("${column}"), 0) FROM "${table}" WHERE tenant_id = $1)::int AS "${kind}"`;
      })
      .join(", ");
    const rows = await this.runQuery<Record<FolioKind, number>>(`SELECT ${selects}`, [this.currentTenantId()]);
    return rows[0];
  }
}
