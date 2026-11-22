import { singleton, inject } from "tsyringe";
import { Decimal } from "decimal.js";
import { CashSessionDao } from "../daos/cash-session.dao.js";
import { CashMovementDao } from "../daos/cash-movement.dao.js";
import { LocalService } from "../../../app_platform/local/services/local.service.js";
import { UserDao } from "../../../identity/auth/daos/user.dao.js";
import { UserRoleDao } from "../../../identity/auth/daos/user-role.dao.js";
import { effectivePermissions } from "../../../identity/authz/permissions.js";
import { can, currentUserId } from "../../../identity/authz/access.js";
import { CashSession } from "../entities/cash-session.entity.js";
import { CashMovement, CashMovementMethod, CashMovementRelatedEntityType, CashMovementType } from "../entities/cash-movement.entity.js";
import { roundCashAmount } from "../utils/round-cash-amount.js";
import { buildCashSummary, buildVarianceStats, cashMethodTotals } from "../utils/cash-summary.js";
import type { CashCutRow, CashSummary, CashVarianceStats } from "../types/cash-report.types.js";

export interface RegisterCashMovementInput {
  cashSessionId: string;
  type: CashMovementType;
  method: CashMovementMethod;
  amount: number;
  note?: string | null;
  relatedEntityType?: CashMovementRelatedEntityType;
  relatedEntityId?: string | null;
}

export interface CashCut {
  cut: CashCutRow;
  summary: CashSummary;
  movements: CashMovement[];
  expectedCash: string;
}

@singleton()
export class CashService {
  constructor(
    private sessionDao: CashSessionDao,
    private movementDao: CashMovementDao,
    private localService: LocalService,
    private userDao: UserDao,
    private userRoleDao: UserRoleDao,
  ) {}

  async getAllSessions(branchId?: string | null): Promise<CashSession[]> {
    return this.sessionDao.findAllOrdered(branchId);
  }

  async getSessionById(id: string): Promise<CashSession | null> {
    return this.sessionDao.findById(id);
  }

  async getOpenSession(localId: string): Promise<CashSession | null> {
    return this.sessionDao.findOpenByLocal(localId);
  }

  // Quien abre (y quien registra un movimiento) es siempre el usuario de la sesión: el cliente
  // no puede atribuir la operación a otra persona.
  async openSession(localId: string, openingBalance: number): Promise<CashSession> {
    const existing = await this.sessionDao.findOpenByLocal(localId);
    if (existing) {
      throw new Error("Ya hay una sesión de caja abierta para este local");
    }
    return this.sessionDao.create({
      localId,
      openingBalance,
      openedByEmployeeId: currentUserId(),
      status: "open",
    } as Partial<CashSession>);
  }

  // Arqueo ciego: el esperado se calcula aqui, en el momento del cierre,
  // nunca antes (la pantalla no debe mostrarlo mientras la sesion esta
  // abierta). Dos puertas bloquean el cierre, en este orden: diferencia sin
  // motivo, o diferencia sobre el limite del tenant sin un autorizador con
  // rol owner (SPEC-fase3-pos-dinero.md). Si cualquiera de las dos
  // truena, la sesion se queda "open" -- mismo criterio que una Sale que no
  // pasa sus compuertas nunca llega a crearse.
  async closeSession(
    id: string,
    closingBalance: number,
    reason?: string | null,
    authorizedByEmployeeId?: string | null,
  ): Promise<CashSession> {
    const session = await this.sessionDao.findById(id);
    if (!session) throw new Error("Sesión de caja no encontrada");
    if (session.status === "closed") throw new Error("La sesión ya está cerrada");

    const cash = cashMethodTotals(await this.movementDao.findBySession(id)).efectivo;
    const expectedCashBalance = new Decimal(String(session.openingBalance)).plus(cash.income).minus(cash.expense);
    const variance = new Decimal(closingBalance).minus(expectedCashBalance);

    if (!variance.isZero() && !reason) {
      throw new Error("Hay una diferencia de caja: se requiere un motivo para cerrar");
    }

    const local = await this.localService.getConfig();
    const maxUnauthorized = new Decimal(local.maxUnauthorizedCashVariance);
    if (variance.abs().greaterThan(maxUnauthorized)) {
      if (!authorizedByEmployeeId) {
        throw new Error(`La diferencia supera el límite sin autorizar (${maxUnauthorized.toFixed(2)}): requiere autorización`);
      }
      const authorizer = await this.userDao.findById(authorizedByEmployeeId);
      const authorizerRoles = authorizer?.isActive ? await this.userRoleDao.findRolesOf(authorizer.id) : [];
      if (!effectivePermissions(authorizerRoles, false).has("cash.authorize-variance")) {
        throw new Error("Quien autoriza la diferencia debe poder autorizar diferencias de caja");
      }
    }

    const updated = await this.sessionDao.update(id, {
      status: "closed",
      closingBalance,
      closedAt: new Date(),
      variance: variance.toNumber(),
      varianceReason: variance.isZero() ? null : reason ?? null,
      varianceAuthorizedByEmployeeId: authorizedByEmployeeId ?? null,
      closedByEmployeeId: currentUserId(),
    } as Partial<CashSession>);
    return updated as CashSession;
  }

  // El redondeo solo se aplica en efectivo -- tarjeta/transferencia siempre
  // liquidan el monto exacto. El monto ya redondeado es lo que se persiste,
  // para que el total de la sesion siempre cuadre con la suma registrada.
  async registerMovement(input: RegisterCashMovementInput): Promise<CashMovement> {
    const session = await this.sessionDao.findById(input.cashSessionId);
    if (!session) throw new Error("Sesión de caja no encontrada");
    if (session.status !== "open") {
      throw new Error("No se pueden registrar movimientos en una sesión cerrada");
    }

    let amount = input.amount;
    if (input.method === "efectivo") {
      const local = await this.localService.getConfig();
      amount = roundCashAmount(amount, Number(local.cashRoundingUnit));
    }

    return this.movementDao.create({
      cashSessionId: input.cashSessionId,
      type: input.type,
      method: input.method,
      amount,
      note: input.note ?? null,
      relatedEntityType: input.relatedEntityType ?? "manual",
      relatedEntityId: input.relatedEntityId ?? null,
      createdByEmployeeId: currentUserId(),
    } as Partial<CashMovement>);
  }

  async getMovements(cashSessionId: string): Promise<CashMovement[] | null> {
    const session = await this.sessionDao.findById(cashSessionId);
    if (!session) return null;
    const movements = await this.movementDao.findBySession(cashSessionId);
    if (!this.hidesAmounts(session)) return movements;
    return movements.map((movement) =>
      movement.method === "efectivo" ? ({ ...movement, amount: null } as unknown as CashMovement) : movement,
    );
  }

  async getSummary(cashSessionId: string): Promise<CashSummary | null> {
    const session = await this.sessionDao.findById(cashSessionId);
    if (!session) return null;
    const [movements, local] = await Promise.all([
      this.movementDao.findBySession(cashSessionId),
      this.localService.getConfig(),
    ]);
    return buildCashSummary(movements, { hideAmounts: this.hidesAmounts(session), timeZone: local.timeZone });
  }

  async getCuts(branchId: string | null, limit = 50): Promise<CashCutRow[]> {
    return this.sessionDao.findClosedCuts({ branchId, limit });
  }

  async getLastCut(branchId: string | null): Promise<CashCutRow | null> {
    const [last] = await this.sessionDao.findClosedCuts({ branchId, limit: 1 });
    return last ?? null;
  }

  async getVarianceStats(branchId: string | null): Promise<CashVarianceStats> {
    const local = await this.localService.getConfig();
    const cuts = await this.sessionDao.findClosedCuts({ branchId, monthOf: { timeZone: local.timeZone } });
    const month = new Date().toLocaleDateString("en-CA", { timeZone: local.timeZone }).slice(0, 7);
    return buildVarianceStats(cuts, month);
  }

  async getCut(sessionId: string): Promise<CashCut | null> {
    const [cut] = await this.sessionDao.findClosedCuts({ sessionId, limit: 1 });
    if (!cut) return null;
    const [movements, local] = await Promise.all([
      this.movementDao.findBySession(sessionId),
      this.localService.getConfig(),
    ]);
    const cash = cashMethodTotals(movements).efectivo;
    return {
      cut,
      movements,
      summary: buildCashSummary(movements, { hideAmounts: false, timeZone: local.timeZone }),
      expectedCash: new Decimal(cut.openingBalance).plus(cash.income).minus(cash.expense).toFixed(2),
    };
  }

  private hidesAmounts(session: CashSession): boolean {
    return session.status === "open" && !can("cash.authorize-variance");
  }
}
