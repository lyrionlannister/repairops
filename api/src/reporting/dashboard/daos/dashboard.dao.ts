import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { CashMovement } from "../../../commerce/cash/entities/cash-movement.entity.js";

export interface IncomeSummaryRow {
  today: string;
  yesterday: string;
  week: string;
  month: string;
  previousMonth: string;
  salesToday: string;
}

export interface OperationalCountsRow {
  openRepairNotes: number;
  criticalStockItems: number;
  openCashSessions: number;
}

export interface ActivityRow {
  id: string;
  publicId: string;
  kind: "sale" | "repair" | "other";
  title: string;
  subtitle: string;
  amount: string;
  occurredAt: string;
}

export interface DailySeriesRow {
  bucket: string;
  sales: string;
  repairs: string;
}

export interface MonthlySeriesRow {
  month: number;
  sales: string;
  repairs: string;
}

// Dinero cobrado: movimientos de caja `income`, menos los `expense` ligados a
// una devolucion. Un gasto manual es gasto, no resta ingresos. Ventas y
// apartados cuentan como "ventas"; notas y cotizaciones como "reparaciones".
const SIGNED_AMOUNT = `
  CASE
    WHEN m.tipo = 'income' THEN m.monto
    WHEN m.tipo = 'expense' AND m.tipo_entidad_relacionada = 'return' THEN -m.monto
    ELSE 0
  END`;

const IS_SALES = `m.tipo_entidad_relacionada IN ('sale', 'layaway', 'return')`;
const IS_REPAIRS = `m.tipo_entidad_relacionada IN ('repair_note', 'quote')`;

// Todas las consultas filtran por tenant y, si se pide, por sucursal (local de
// la sesion de caja del movimiento). Los limites de dia, semana (lunes) y mes
// se calculan en la zona horaria del tenant con AT TIME ZONE.
@singleton()
export class DashboardDao {
  constructor(@inject(repositoryToken(CashMovement)) private repository: Repository<CashMovement>) {}

  async getIncomeSummary(timeZone: string, branchId: string | null): Promise<IncomeSummaryRow> {
    const rows = await this.repository.query<IncomeSummaryRow[]>(
      `
      WITH bounds AS (
        SELECT
          ((date_trunc('day', now() AT TIME ZONE $2) AT TIME ZONE $2) AT TIME ZONE 'UTC') AS day_start,
          (((date_trunc('day', now() AT TIME ZONE $2) - INTERVAL '1 day') AT TIME ZONE $2) AT TIME ZONE 'UTC') AS yesterday_start,
          ((date_trunc('week', now() AT TIME ZONE $2) AT TIME ZONE $2) AT TIME ZONE 'UTC') AS week_start,
          ((date_trunc('month', now() AT TIME ZONE $2) AT TIME ZONE $2) AT TIME ZONE 'UTC') AS month_start,
          (((date_trunc('month', now() AT TIME ZONE $2) - INTERVAL '1 month') AT TIME ZONE $2) AT TIME ZONE 'UTC') AS prev_month_start
      ), moves AS (
        SELECT m.fecha_creacion AS created_at, (${SIGNED_AMOUNT}) AS amount, (${IS_SALES}) AS is_sales
        FROM cash_movements m
        JOIN cash_sessions s ON s.id = m.id_sesion_caja AND s.tenant_id = m.tenant_id
        CROSS JOIN bounds b
        WHERE m.tenant_id = $1
          AND ($3::bigint IS NULL OR s.local_id = $3::bigint)
          AND m.fecha_creacion >= LEAST(b.prev_month_start, b.week_start, b.yesterday_start)
      )
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE created_at >= b.day_start), 0)::numeric(14,2)::text AS "today",
        COALESCE(SUM(amount) FILTER (WHERE created_at >= b.yesterday_start AND created_at < b.day_start), 0)::numeric(14,2)::text AS "yesterday",
        COALESCE(SUM(amount) FILTER (WHERE created_at >= b.week_start), 0)::numeric(14,2)::text AS "week",
        COALESCE(SUM(amount) FILTER (WHERE created_at >= b.month_start), 0)::numeric(14,2)::text AS "month",
        COALESCE(SUM(amount) FILTER (WHERE created_at >= b.prev_month_start AND created_at < b.month_start), 0)::numeric(14,2)::text AS "previousMonth",
        COALESCE(SUM(amount) FILTER (WHERE created_at >= b.day_start AND is_sales), 0)::numeric(14,2)::text AS "salesToday"
      FROM moves CROSS JOIN bounds b
      `,
      [getCurrentTenantId(), timeZone, branchId],
    );
    return rows[0];
  }

  async getOperationalCounts(branchId: string | null): Promise<OperationalCountsRow> {
    const rows = await this.repository.query<OperationalCountsRow[]>(
      `
      SELECT
        (SELECT COUNT(*) FROM repair_notes n
          WHERE n.tenant_id = $1 AND n.estado NOT IN ('delivered', 'cancelled')
            AND ($2::bigint IS NULL OR n.local_id = $2::bigint))::int AS "openRepairNotes",
        (SELECT COUNT(*) FROM inventory_items i
          WHERE i.tenant_id = $1 AND i.cantidad_disponible <= GREATEST(i.stock_minimo, 3)
            AND ($2::bigint IS NULL OR i.local_id = $2::bigint))::int AS "criticalStockItems",
        (SELECT COUNT(*) FROM cash_sessions s
          WHERE s.tenant_id = $1 AND s.estado = 'open'
            AND ($2::bigint IS NULL OR s.local_id = $2::bigint))::int AS "openCashSessions"
      `,
      [getCurrentTenantId(), branchId],
    );
    return rows[0];
  }

  async getRecentActivity(branchId: string | null, limit = 10): Promise<ActivityRow[]> {
    return this.repository.query<ActivityRow[]>(
      `
      SELECT
        m.id::text AS id,
        m.public_id::text AS "publicId",
        CASE WHEN m.tipo_entidad_relacionada IN ('sale', 'layaway', 'return') THEN 'sale'
             WHEN m.tipo_entidad_relacionada IN ('repair_note', 'quote') THEN 'repair'
             ELSE 'other' END AS kind,
        CASE
          WHEN m.tipo_entidad_relacionada = 'sale' THEN COALESCE(NULLIF(sa.nombre_cliente, ''), 'Venta #' || sa.numero_venta)
          WHEN m.tipo_entidad_relacionada = 'repair_note' THEN COALESCE(rn.nombre_cliente, 'Nota')
          WHEN m.tipo_entidad_relacionada = 'return' THEN 'Devolución'
          WHEN m.tipo_entidad_relacionada = 'layaway' THEN 'Apartado'
          WHEN m.tipo_entidad_relacionada = 'quote' THEN 'Cotización'
          ELSE COALESCE(NULLIF(m.nota, ''), 'Movimiento manual')
        END AS title,
        CASE m.tipo_entidad_relacionada
          WHEN 'sale' THEN 'Venta'
          WHEN 'repair_note' THEN 'Nota #' || rn.numero_control
          WHEN 'return' THEN 'Devolución'
          WHEN 'layaway' THEN 'Apartado'
          WHEN 'quote' THEN 'Cotización'
          ELSE CASE m.tipo WHEN 'income' THEN 'Ingreso' ELSE 'Gasto' END
        END AS subtitle,
        (CASE WHEN m.tipo = 'income' THEN m.monto ELSE -m.monto END)::text AS amount,
        m.fecha_creacion AS "occurredAt"
      FROM cash_movements m
      JOIN cash_sessions s ON s.id = m.id_sesion_caja AND s.tenant_id = m.tenant_id
      LEFT JOIN sales sa ON m.tipo_entidad_relacionada = 'sale' AND sa.id = m.id_entidad_relacionada AND sa.tenant_id = m.tenant_id
      LEFT JOIN repair_notes rn ON m.tipo_entidad_relacionada = 'repair_note' AND rn.id = m.id_entidad_relacionada AND rn.tenant_id = m.tenant_id
      WHERE m.tenant_id = $1 AND ($2::bigint IS NULL OR s.local_id = $2::bigint)
      ORDER BY m.fecha_creacion DESC, m.id DESC
      LIMIT $3
      `,
      [getCurrentTenantId(), branchId, limit],
    );
  }

  async getDailySeries(timeZone: string, branchId: string | null, days = 30): Promise<DailySeriesRow[]> {
    return this.repository.query<DailySeriesRow[]>(
      `
      WITH days AS (
        SELECT d::date AS day
        FROM generate_series((now() AT TIME ZONE $2)::date - ($4::int - 1), (now() AT TIME ZONE $2)::date, INTERVAL '1 day') AS d
      ), moves AS (
        SELECT ((m.fecha_creacion AT TIME ZONE 'UTC') AT TIME ZONE $2)::date AS day, (${SIGNED_AMOUNT}) AS amount, (${IS_SALES}) AS is_sales, (${IS_REPAIRS}) AS is_repairs
        FROM cash_movements m
        JOIN cash_sessions s ON s.id = m.id_sesion_caja AND s.tenant_id = m.tenant_id
        WHERE m.tenant_id = $1
          AND ($3::bigint IS NULL OR s.local_id = $3::bigint)
          AND m.fecha_creacion >= (((now() AT TIME ZONE $2)::date - ($4::int - 1)) AT TIME ZONE $2) AT TIME ZONE 'UTC'
      )
      SELECT
        TO_CHAR(days.day, 'YYYY-MM-DD') AS bucket,
        COALESCE(SUM(moves.amount) FILTER (WHERE moves.is_sales), 0)::numeric(14,2)::text AS sales,
        COALESCE(SUM(moves.amount) FILTER (WHERE moves.is_repairs), 0)::numeric(14,2)::text AS repairs
      FROM days LEFT JOIN moves ON moves.day = days.day
      GROUP BY days.day
      ORDER BY days.day
      `,
      [getCurrentTenantId(), timeZone, branchId, days],
    );
  }

  async getMonthlySeries(timeZone: string, branchId: string | null, year: number): Promise<MonthlySeriesRow[]> {
    return this.repository.query<MonthlySeriesRow[]>(
      `
      WITH months AS (SELECT generate_series(1, 12) AS month), moves AS (
        SELECT EXTRACT(MONTH FROM (m.fecha_creacion AT TIME ZONE 'UTC') AT TIME ZONE $2)::int AS month,
               (${SIGNED_AMOUNT}) AS amount, (${IS_SALES}) AS is_sales, (${IS_REPAIRS}) AS is_repairs
        FROM cash_movements m
        JOIN cash_sessions s ON s.id = m.id_sesion_caja AND s.tenant_id = m.tenant_id
        WHERE m.tenant_id = $1
          AND ($3::bigint IS NULL OR s.local_id = $3::bigint)
          AND m.fecha_creacion >= (make_timestamp($4::int, 1, 1, 0, 0, 0) AT TIME ZONE $2) AT TIME ZONE 'UTC'
          AND m.fecha_creacion <  (make_timestamp($4::int + 1, 1, 1, 0, 0, 0) AT TIME ZONE $2) AT TIME ZONE 'UTC'
      )
      SELECT months.month,
        COALESCE(SUM(moves.amount) FILTER (WHERE moves.is_sales), 0)::numeric(14,2)::text AS sales,
        COALESCE(SUM(moves.amount) FILTER (WHERE moves.is_repairs), 0)::numeric(14,2)::text AS repairs
      FROM months LEFT JOIN moves ON moves.month = months.month
      GROUP BY months.month
      ORDER BY months.month
      `,
      [getCurrentTenantId(), timeZone, branchId, year],
    );
  }
}
