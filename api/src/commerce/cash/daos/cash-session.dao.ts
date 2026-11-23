import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { CashSession } from "../entities/cash-session.entity.js";
import { CashMovement } from "../entities/cash-movement.entity.js";
import { User } from "../../../identity/auth/entities/user.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";
import type { CashCutQuery, CashCutRow } from "../types/cash-report.types.js";

interface RawCutRow {
  id: string;
  publicId: string;
  cutNumber: number;
  localId: string;
  openedAt: Date;
  closedAt: Date | null;
  openedByName: string | null;
  closedByName: string | null;
  openingBalance: string;
  closingBalance: string | null;
  variance: string | null;
  varianceReason: string | null;
  totalIncome: string;
  totalExpense: string;
  movementCount: string;
}

@singleton()
export class CashSessionDao extends TenantScopedDao<CashSession> {
  constructor(@inject(repositoryToken(CashSession)) repository: Repository<CashSession>) {
    super(repository);
  }

  async findOpenByLocal(localId: string): Promise<CashSession | null> {
    return this.scoped()
      .andWhere("entity.localId = :localId", { localId })
      .andWhere("entity.status = 'open'")
      .getOne();
  }

  async findAllOrdered(branchId?: string | null): Promise<CashSession[]> {
    return this.scoped()
      .andWhere(branchId ? "entity.localId = :branchId" : "1 = 1", { branchId })
      .orderBy("entity.openedAt", "DESC")
      .getMany();
  }

  // Los totales se suman en Postgres (numeric exacto) y llegan como texto: nunca pasan por float.
  async findClosedCuts(query: CashCutQuery): Promise<CashCutRow[]> {
    const builder = this.scoped("s")
      .leftJoin(CashMovement, "m", "m.cashSessionId = s.id AND m.tenantId = s.tenantId")
      .leftJoin(User, "o", "o.id = s.openedByEmployeeId AND o.tenantId = s.tenantId")
      .leftJoin(User, "c", "c.id = s.closedByEmployeeId AND c.tenantId = s.tenantId")
      .andWhere("s.status = 'closed'")
      .select("s.id::text", "id")
      .addSelect("s.public_id::text", "publicId")
      .addSelect("s.numero_corte", "cutNumber")
      .addSelect("s.local_id::text", "localId")
      .addSelect("s.fecha_apertura", "openedAt")
      .addSelect("s.fecha_cierre", "closedAt")
      .addSelect("NULLIF(TRIM(CONCAT(o.nombre, ' ', o.apellido)), '')", "openedByName")
      .addSelect("NULLIF(TRIM(CONCAT(c.nombre, ' ', c.apellido)), '')", "closedByName")
      .addSelect("s.saldo_apertura::text", "openingBalance")
      .addSelect("s.saldo_cierre::text", "closingBalance")
      .addSelect("s.diferencia::text", "variance")
      .addSelect("s.motivo_diferencia", "varianceReason")
      .addSelect(
        "COALESCE(SUM(m.monto) FILTER (WHERE m.tipo = 'income'), 0)::numeric(12,2)::text",
        "totalIncome",
      )
      .addSelect(
        "COALESCE(SUM(m.monto) FILTER (WHERE m.tipo = 'expense'), 0)::numeric(12,2)::text",
        "totalExpense",
      )
      .addSelect("COUNT(m.id)::text", "movementCount")
      .groupBy("s.id")
      .addGroupBy("o.id")
      .addGroupBy("c.id")
      .orderBy("s.closedAt", "DESC");

    if (query.branchId) builder.andWhere("s.localId = :branchId", { branchId: query.branchId });
    if (query.sessionId) builder.andWhere("s.id = :sessionId", { sessionId: query.sessionId });
    if (query.monthOf) {
      builder.andWhere(
        "(s.fecha_cierre AT TIME ZONE 'UTC' AT TIME ZONE :tz) >= date_trunc('month', now() AT TIME ZONE :tz)",
        { tz: query.monthOf.timeZone },
      );
    }
    if (query.limit) builder.limit(query.limit);

    const rows = await builder.getRawMany<RawCutRow>();
    return rows.map((row) => ({ ...row, movementCount: Number(row.movementCount) }));
  }
}
