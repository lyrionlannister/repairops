import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { RepairNote } from "../../../commerce/repair-notes/entities/repair-note.entity.js";

export interface EmployeeTotalsRow {
  employeeId: string;
  count: number;
  total: string;
  itemsCost: string;
  itemsSale: string;
}

export interface ReportEmployeeRow {
  id: string;
  publicId: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  salaryAmount: string | null;
  payCycle: "weekly" | "biweekly" | "monthly" | null;
}

export interface AccessoryTotalsRow {
  salesCount: number;
  totalRevenue: string;
}

export interface AccessoryGroupRow {
  key: string;
  label: string;
  quantity: number;
  revenue: string;
}

export interface NotesTotalsRow {
  totalNotes: number;
  totalRevenue: string;
}

export interface NotesByTypeRow {
  type: string;
  label: string;
  count: number;
  totalValue: string;
}

export interface NotesByStatusRow {
  status: string;
  count: number;
  totalValue: string;
}

// Dia de una venta en la zona horaria del tenant. fecha_creacion es `timestamp`
// sin zona guardado en UTC (shortcut: migrar a timestamptz en el modulo cleanup).
const SALE_DAY = `((s.fecha_creacion AT TIME ZONE 'UTC') AT TIME ZONE $4)::date`;

// Agregados en SQL con filtro de tenant en cada tabla: los reportes ya no cargan
// todo para sumar en memoria. Los importes salen como numeric -> texto.
@singleton()
export class ReportsDao {
  constructor(@inject(repositoryToken(RepairNote)) private repository: Repository<RepairNote>) {}

  // Con sucursal: quien esta asignado a ella, mas quien tuvo actividad ahi en el
  // periodo (el owner no tiene user_branches y aun asi puede vender en cualquiera).
  reportEmployees(
    start: string,
    end: string,
    timeZone: string,
    branchId: string | null,
  ): Promise<ReportEmployeeRow[]> {
    return this.repository.query(
      `
      SELECT u.id::text AS id, u.public_id::text AS "publicId", u.nombre AS "firstName", u.apellido AS "lastName",
             u.activo AS "isActive", u.salario::text AS "salaryAmount", u.ciclo_pago AS "payCycle"
      FROM usuarios u
      WHERE u.tenant_id = $1
        AND (
          ($5::bigint IS NULL AND u.activo)
          OR ($5::bigint IS NOT NULL AND u.activo AND EXISTS (
            SELECT 1 FROM user_branches ub WHERE ub.user_id = u.id AND ub.tenant_id = $1 AND ub.branch_id = $5::bigint))
          OR EXISTS (
            SELECT 1 FROM repair_notes n
            WHERE n.tenant_id = $1 AND n.id_empleado_asignado = u.id AND n.estado <> 'cancelled'
              AND n.fecha_recepcion BETWEEN $2::date AND $3::date AND ($5::bigint IS NULL OR n.local_id = $5::bigint))
          OR EXISTS (
            SELECT 1 FROM sales s
            WHERE s.tenant_id = $1 AND s.id_empleado_creador = u.id AND ${SALE_DAY} BETWEEN $2::date AND $3::date
              AND ($5::bigint IS NULL OR s.local_id = $5::bigint))
        )
      ORDER BY u.nombre, u.apellido, u.id
      `,
      [getCurrentTenantId(), start, end, timeZone, branchId],
    );
  }

  notesByEmployee(
    start: string,
    end: string,
    branchId: string | null,
  ): Promise<EmployeeTotalsRow[]> {
    return this.repository.query(
      `
      SELECT n.id_empleado_asignado::text AS "employeeId",
             COUNT(*)::int AS count,
             COALESCE(SUM(n.valor_total), 0)::numeric(14,2)::text AS total,
             COALESCE(SUM(it.cost), 0)::numeric(14,2)::text AS "itemsCost",
             COALESCE(SUM(it.sale), 0)::numeric(14,2)::text AS "itemsSale"
      FROM repair_notes n
      LEFT JOIN LATERAL (
        SELECT SUM(ri.cantidad * COALESCE(inv.precio_costo, 0)) AS cost, SUM(ri.cantidad * ri.precio_unitario) AS sale
        FROM repair_note_items ri
        LEFT JOIN inventory_items inv ON inv.id = ri.id_item_inventario AND inv.tenant_id = ri.tenant_id
        WHERE ri.id_nota_reparacion = n.id AND ri.tenant_id = n.tenant_id
      ) it ON true
      WHERE n.tenant_id = $1 AND n.id_empleado_asignado IS NOT NULL AND n.estado <> 'cancelled'
        AND n.fecha_recepcion BETWEEN $2::date AND $3::date
        AND ($4::bigint IS NULL OR n.local_id = $4::bigint)
      GROUP BY n.id_empleado_asignado
      `,
      [getCurrentTenantId(), start, end, branchId],
    );
  }

  // Un renglon de servicio (tipo_linea 'service_type') no tiene costo de
  // inventario: el margen es el precio completo.
  salesByEmployee(
    start: string,
    end: string,
    timeZone: string,
    branchId: string | null,
  ): Promise<EmployeeTotalsRow[]> {
    return this.repository.query(
      `
      SELECT s.id_empleado_creador::text AS "employeeId",
             COUNT(*)::int AS count,
             COALESCE(SUM(s.valor_total), 0)::numeric(14,2)::text AS total,
             COALESCE(SUM(it.cost), 0)::numeric(14,2)::text AS "itemsCost",
             COALESCE(SUM(it.sale), 0)::numeric(14,2)::text AS "itemsSale"
      FROM sales s
      LEFT JOIN LATERAL (
        SELECT SUM(CASE WHEN si.tipo_linea = 'inventory_item' THEN si.cantidad * COALESCE(inv.precio_costo, 0) ELSE 0 END) AS cost,
               SUM(si.cantidad * si.precio_unitario) AS sale
        FROM sale_items si
        LEFT JOIN inventory_items inv ON si.tipo_linea = 'inventory_item' AND inv.id = si.id_referencia AND inv.tenant_id = si.tenant_id
        WHERE si.id_venta = s.id AND si.tenant_id = s.tenant_id
      ) it ON true
      WHERE s.tenant_id = $1 AND s.id_empleado_creador IS NOT NULL AND ${SALE_DAY} BETWEEN $2::date AND $3::date
        AND ($5::bigint IS NULL OR s.local_id = $5::bigint)
      GROUP BY s.id_empleado_creador
      `,
      [getCurrentTenantId(), start, end, timeZone, branchId],
    );
  }

  async accessoryTotals(
    start: string,
    end: string,
    timeZone: string,
    branchId: string | null,
  ): Promise<AccessoryTotalsRow> {
    const rows = await this.repository.query<AccessoryTotalsRow[]>(
      `
      SELECT COUNT(*)::int AS "salesCount", COALESCE(SUM(s.valor_total), 0)::numeric(14,2)::text AS "totalRevenue"
      FROM sales s
      WHERE s.tenant_id = $1 AND ${SALE_DAY} BETWEEN $2::date AND $3::date
        AND ($5::bigint IS NULL OR s.local_id = $5::bigint)
      `,
      [getCurrentTenantId(), start, end, timeZone, branchId],
    );
    return rows[0];
  }

  accessoryByItem(
    start: string,
    end: string,
    timeZone: string,
    branchId: string | null,
  ): Promise<AccessoryGroupRow[]> {
    return this.repository.query(
      `
      SELECT COALESCE(inv.public_id::text, md5(si.id_referencia::text)) AS key,
             COALESCE(inv.nombre, 'Producto eliminado') AS label,
             SUM(si.cantidad)::int AS quantity,
             SUM(si.cantidad * si.precio_unitario)::numeric(14,2)::text AS revenue
      FROM sale_items si
      JOIN sales s ON s.id = si.id_venta AND s.tenant_id = si.tenant_id
      LEFT JOIN inventory_items inv ON inv.id = si.id_referencia AND inv.tenant_id = si.tenant_id
      WHERE si.tenant_id = $1 AND si.tipo_linea = 'inventory_item' AND ${SALE_DAY} BETWEEN $2::date AND $3::date
        AND ($5::bigint IS NULL OR s.local_id = $5::bigint)
      GROUP BY si.id_referencia, inv.public_id, inv.nombre
      ORDER BY SUM(si.cantidad * si.precio_unitario) DESC
      `,
      [getCurrentTenantId(), start, end, timeZone, branchId],
    );
  }

  accessoryByPeriod(
    start: string,
    end: string,
    timeZone: string,
    groupBy: "day" | "week",
    branchId: string | null,
  ): Promise<AccessoryGroupRow[]> {
    const bucket =
      groupBy === "day"
        ? `TO_CHAR(${SALE_DAY}, 'YYYY-MM-DD')`
        : `TO_CHAR(${SALE_DAY}, 'IYYY-"W"IW')`;
    return this.repository.query(
      `
      SELECT ${bucket} AS key, ${bucket} AS label,
             COALESCE(SUM(q.quantity), 0)::int AS quantity,
             SUM(s.valor_total)::numeric(14,2)::text AS revenue
      FROM sales s
      LEFT JOIN LATERAL (
        SELECT SUM(si.cantidad) AS quantity FROM sale_items si
        WHERE si.id_venta = s.id AND si.tenant_id = s.tenant_id AND si.tipo_linea = 'inventory_item'
      ) q ON true
      WHERE s.tenant_id = $1 AND ${SALE_DAY} BETWEEN $2::date AND $3::date
        AND ($5::bigint IS NULL OR s.local_id = $5::bigint)
      GROUP BY 1
      ORDER BY 1
      `,
      [getCurrentTenantId(), start, end, timeZone, branchId],
    );
  }

  async notesTotals(start: string, end: string, branchId: string | null): Promise<NotesTotalsRow> {
    const rows = await this.repository.query<NotesTotalsRow[]>(
      `
      SELECT (COUNT(*) FILTER (WHERE estado <> 'cancelled'))::int AS "totalNotes",
             COALESCE(SUM(valor_total) FILTER (WHERE estado <> 'cancelled'), 0)::numeric(14,2)::text AS "totalRevenue"
      FROM repair_notes
      WHERE tenant_id = $1 AND fecha_recepcion BETWEEN $2::date AND $3::date
        AND ($4::bigint IS NULL OR local_id = $4::bigint)
      `,
      [getCurrentTenantId(), start, end, branchId],
    );
    return rows[0];
  }

  notesByType(start: string, end: string, branchId: string | null): Promise<NotesByTypeRow[]> {
    return this.repository.query(
      `
      SELECT st.public_id::text AS type, st.nombre AS label,
             COUNT(n.id)::int AS count,
             COALESCE(SUM(n.valor_total), 0)::numeric(14,2)::text AS "totalValue"
      FROM service_types st
      JOIN (SELECT DISTINCT l.id_tipo_servicio, l.id_nota_reparacion FROM repair_note_service_types l WHERE l.tenant_id = $1) link
        ON link.id_tipo_servicio = st.id
      JOIN repair_notes n ON n.id = link.id_nota_reparacion AND n.tenant_id = $1 AND n.estado <> 'cancelled'
        AND n.fecha_recepcion BETWEEN $2::date AND $3::date
        AND ($4::bigint IS NULL OR n.local_id = $4::bigint)
      WHERE st.tenant_id = $1
      GROUP BY st.id, st.public_id, st.nombre
      ORDER BY COUNT(n.id) DESC, st.nombre ASC
      `,
      [getCurrentTenantId(), start, end, branchId],
    );
  }

  notesByStatus(start: string, end: string, branchId: string | null): Promise<NotesByStatusRow[]> {
    return this.repository.query(
      `
      SELECT estado AS status, COUNT(*)::int AS count, COALESCE(SUM(valor_total), 0)::numeric(14,2)::text AS "totalValue"
      FROM repair_notes
      WHERE tenant_id = $1 AND fecha_recepcion BETWEEN $2::date AND $3::date
        AND ($4::bigint IS NULL OR local_id = $4::bigint)
      GROUP BY estado
      `,
      [getCurrentTenantId(), start, end, branchId],
    );
  }
}
