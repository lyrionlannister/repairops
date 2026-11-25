import { singleton } from "tsyringe";
import { Decimal } from "decimal.js";
import { ReportsDao, EmployeeTotalsRow } from "../daos/reports.dao.js";
import { RevenueAttributionService } from "../../../commerce/revenue-attribution/services/revenue-attribution.service.js";
import { AttributionBasis } from "../../../commerce/revenue-attribution/entities/revenue-attribution-setting.entity.js";
import { LocalService } from "../../../app_platform/local/services/local.service.js";
import { AccessorySalesGroupBy } from "../dtos/accessory-sales-query.dto.js";
import { dayCount, resolvePeriod, salaryForPeriod } from "../utils/report-period.utils.js";
import { BusinessError } from "../../../core/http/business-error.js";

const MAX_PERIOD_DAYS = 366;

// Los agregados ya vienen del SQL (ver ReportsDao); aqui solo se aplica la base
// de atribucion y el prorrateo de salario, con Decimal. Al JSON salen numeros
// con 2 decimales, igual que antes.
const toNumber = (value: Decimal.Value): number =>
  new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

// Formula compartida por los reportes: "ingreso atribuido" significa lo mismo en
// empleados, accesorios y notas por tipo.
function attribute(row: EmployeeTotalsRow | undefined, basis: AttributionBasis): Decimal {
  if (!row) return new Decimal(0);
  const total = new Decimal(row.total);
  if (basis === "margin") return total.minus(row.itemsCost);
  if (basis === "labor_only") return total.minus(row.itemsSale);
  return total;
}

@singleton()
export class ReportsService {
  constructor(
    private reportsDao: ReportsDao,
    private revenueAttributionService: RevenueAttributionService,
    private localService: LocalService,
  ) {}

  // "Hoy" y el mes en curso se calculan en la zona horaria del taller.
  private async period(periodStart?: string, periodEnd?: string) {
    const { timeZone } = await this.localService.getConfig();
    const resolved = resolvePeriod(periodStart, periodEnd, timeZone);
    if (resolved.start > resolved.end) {
      throw new BusinessError("La fecha inicial no puede ser posterior a la final", 400);
    }
    if (dayCount(resolved.start, resolved.end) > MAX_PERIOD_DAYS) {
      throw new BusinessError("El periodo no puede ser mayor a un año", 400);
    }
    return { timeZone, ...resolved };
  }

  async getEmployeePerformance(query: {
    employeeId?: string;
    periodStart?: string;
    periodEnd?: string;
    branchId?: string | null;
  }) {
    const { start, end, timeZone } = await this.period(query.periodStart, query.periodEnd);
    const branchId = query.branchId ?? null;

    const [employees, noteRows, saleRows, setting] = await Promise.all([
      this.reportsDao.reportEmployees(start, end, timeZone, branchId),
      this.reportsDao.notesByEmployee(start, end, branchId),
      this.reportsDao.salesByEmployee(start, end, timeZone, branchId),
      this.revenueAttributionService.getSetting(),
    ]);

    const notesByEmployee = new Map(noteRows.map((row) => [row.employeeId, row]));
    const salesByEmployee = new Map(saleRows.map((row) => [row.employeeId, row]));
    const targetEmployees = query.employeeId
      ? employees.filter((e) => e.publicId === query.employeeId)
      : employees;

    const result = targetEmployees.map((employee) => {
      const notes = notesByEmployee.get(employee.id);
      const sales = salesByEmployee.get(employee.id);
      const attributed = attribute(notes, setting.attributionBasis).plus(
        attribute(sales, setting.attributionBasis),
      );
      const salary =
        employee.salaryAmount && employee.payCycle
          ? salaryForPeriod(employee.salaryAmount, employee.payCycle, start, end)
          : null;

      return {
        employeeId: employee.publicId,
        employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
        isActive: employee.isActive,
        attributedAmount: toNumber(attributed),
        salaryAmount: salary ? toNumber(salary) : null,
        payCycle: employee.payCycle,
        // Sueldo capturado sin ciclo de pago: no se puede prorratear, y antes salia
        // como $0 "cubierto". La UI lo marca como dato incompleto.
        missingPayCycle: Boolean(
          employee.salaryAmount &&
          new Decimal(employee.salaryAmount).greaterThan(0) &&
          !employee.payCycle,
        ),
        coversSalary: salary ? attributed.greaterThanOrEqualTo(salary) : null,
        repairNotesCount: notes?.count ?? 0,
        salesCount: sales?.count ?? 0,
      };
    });

    return {
      attributionBasis: setting.attributionBasis,
      periodStart: start,
      periodEnd: end,
      employees: result,
    };
  }

  async getAccessorySales(query: {
    periodStart?: string;
    periodEnd?: string;
    groupBy?: AccessorySalesGroupBy;
    branchId?: string | null;
  }) {
    const { start, end, timeZone } = await this.period(query.periodStart, query.periodEnd);
    const groupBy = query.groupBy ?? "item";

    const [totals, groups] = await Promise.all([
      this.reportsDao.accessoryTotals(start, end, timeZone, query.branchId ?? null),
      groupBy === "item"
        ? this.reportsDao.accessoryByItem(start, end, timeZone, query.branchId ?? null)
        : this.reportsDao.accessoryByPeriod(start, end, timeZone, groupBy, query.branchId ?? null),
    ]);

    const salesCount = totals.salesCount;
    const averageTicket =
      salesCount > 0 ? new Decimal(totals.totalRevenue).dividedBy(salesCount) : new Decimal(0);

    return {
      periodStart: start,
      periodEnd: end,
      groupBy,
      totalRevenue: toNumber(totals.totalRevenue),
      averageTicket: toNumber(averageTicket),
      salesCount,
      data: groups.map((g) => ({
        key: g.key,
        label: g.label,
        quantity: g.quantity,
        revenue: toNumber(g.revenue),
      })),
    };
  }

  async getRepairNotesByType(query: {
    periodStart?: string;
    periodEnd?: string;
    branchId?: string | null;
  }) {
    const { start, end } = await this.period(query.periodStart, query.periodEnd);
    const [totals, byType, byStatus] = await Promise.all([
      this.reportsDao.notesTotals(start, end, query.branchId ?? null),
      this.reportsDao.notesByType(start, end, query.branchId ?? null),
      this.reportsDao.notesByStatus(start, end, query.branchId ?? null),
    ]);

    return {
      periodStart: start,
      periodEnd: end,
      totalNotes: totals.totalNotes,
      totalRevenue: toNumber(totals.totalRevenue),
      byType: byType.map((t) => ({
        type: t.type,
        label: t.label,
        count: t.count,
        totalValue: toNumber(t.totalValue),
      })),
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s.count,
        totalValue: toNumber(s.totalValue),
      })),
    };
  }
}
