import { singleton } from "tsyringe";
import { Decimal } from "decimal.js";
import { ReportsDao, EmployeeTotalsRow } from "../daos/reports.dao.js";
import { UserDao } from "../../../identity/auth/daos/user.dao.js";
import { PayCycle } from "../../../identity/auth/entities/user.entity.js";
import { RevenueAttributionService } from "../../../commerce/revenue-attribution/services/revenue-attribution.service.js";
import { AttributionBasis } from "../../../commerce/revenue-attribution/entities/revenue-attribution-setting.entity.js";
import { LocalService } from "../../../app_platform/local/services/local.service.js";
import { AccessorySalesGroupBy } from "../dtos/accessory-sales-query.dto.js";
import { dayCount, resolvePeriod } from "../utils/report-period.utils.js";

const CYCLE_DAYS: Record<PayCycle, number> = { weekly: 7, biweekly: 15, monthly: 30 };

// Los agregados ya vienen del SQL (ver ReportsDao); aqui solo se aplica la base
// de atribucion y el prorrateo de salario, con Decimal. Al JSON salen numeros
// con 2 decimales, igual que antes.
const toNumber = (value: Decimal.Value): number => new Decimal(value).toDecimalPlaces(2).toNumber();

function prorateSalary(salaryAmount: number | null, payCycle: PayCycle | null, periodDays: number): Decimal {
  if (!salaryAmount || !payCycle) return new Decimal(0);
  return new Decimal(salaryAmount).dividedBy(CYCLE_DAYS[payCycle]).times(periodDays);
}

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
    private userDao: UserDao,
    private revenueAttributionService: RevenueAttributionService,
    private localService: LocalService,
  ) {}

  // "Hoy" y el mes en curso se calculan en la zona horaria del taller.
  private async period(periodStart?: string, periodEnd?: string) {
    const { timeZone } = await this.localService.getConfig();
    return { timeZone, ...resolvePeriod(periodStart, periodEnd, timeZone) };
  }

  async getEmployeePerformance(query: { employeeId?: string; periodStart?: string; periodEnd?: string }) {
    const { start, end, timeZone } = await this.period(query.periodStart, query.periodEnd);
    const periodDays = dayCount(start, end);

    const [employees, noteRows, saleRows, setting] = await Promise.all([
      this.userDao.findAll(),
      this.reportsDao.notesByEmployee(start, end),
      this.reportsDao.salesByEmployee(start, end, timeZone),
      this.revenueAttributionService.getSetting(),
    ]);

    const notesByEmployee = new Map(noteRows.map((row) => [row.employeeId, row]));
    const salesByEmployee = new Map(saleRows.map((row) => [row.employeeId, row]));
    const targetEmployees = query.employeeId ? employees.filter((e) => e.id === query.employeeId) : employees;

    const result = targetEmployees.map((employee) => {
      const notes = notesByEmployee.get(employee.id);
      const sales = salesByEmployee.get(employee.id);
      const attributed = attribute(notes, setting.attributionBasis).plus(attribute(sales, setting.attributionBasis));
      const salaryForPeriod = prorateSalary(employee.salaryAmount, employee.payCycle, periodDays);

      return {
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
        attributedAmount: toNumber(attributed),
        salaryAmount: toNumber(salaryForPeriod),
        coversSalary: attributed.greaterThanOrEqualTo(salaryForPeriod),
        repairNotesCount: notes?.count ?? 0,
        salesCount: sales?.count ?? 0,
      };
    });

    return { attributionBasis: setting.attributionBasis, periodStart: start, periodEnd: end, employees: result };
  }

  async getAccessorySales(query: { periodStart?: string; periodEnd?: string; groupBy?: AccessorySalesGroupBy }) {
    const { start, end, timeZone } = await this.period(query.periodStart, query.periodEnd);
    const groupBy = query.groupBy ?? "item";

    const [totals, groups] = await Promise.all([
      this.reportsDao.accessoryTotals(start, end, timeZone),
      groupBy === "item"
        ? this.reportsDao.accessoryByItem(start, end, timeZone)
        : this.reportsDao.accessoryByPeriod(start, end, timeZone, groupBy),
    ]);

    const salesCount = totals.salesCount;
    const averageTicket = salesCount > 0 ? new Decimal(totals.totalRevenue).dividedBy(salesCount) : new Decimal(0);

    return {
      periodStart: start,
      periodEnd: end,
      groupBy,
      totalRevenue: toNumber(totals.totalRevenue),
      averageTicket: toNumber(averageTicket),
      salesCount,
      data: groups.map((g) => ({ key: g.key, label: g.label, quantity: g.quantity, revenue: toNumber(g.revenue) })),
    };
  }

  async getRepairNotesByType(query: { periodStart?: string; periodEnd?: string }) {
    const { start, end } = await this.period(query.periodStart, query.periodEnd);
    const [totals, byType, byStatus] = await Promise.all([
      this.reportsDao.notesTotals(start, end),
      this.reportsDao.notesByType(start, end),
      this.reportsDao.notesByStatus(start, end),
    ]);

    return {
      periodStart: start,
      periodEnd: end,
      totalNotes: totals.totalNotes,
      totalRevenue: toNumber(totals.totalRevenue),
      byType: byType.map((t) => ({ type: t.type, label: t.label, count: t.count, totalValue: toNumber(t.totalValue) })),
      byStatus: byStatus.map((s) => ({ status: s.status, count: s.count, totalValue: toNumber(s.totalValue) })),
    };
  }
}
