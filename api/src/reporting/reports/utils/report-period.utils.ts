import { Decimal } from "decimal.js";

// Los reportes de este modulo trabajan con fechas en formato 'YYYY-MM-DD'.
export interface ResolvedPeriod {
  start: string;
  end: string;
}

export type ReportPayCycle = "weekly" | "biweekly" | "monthly";

const DAY_MS = 86_400_000;

// "Hoy" en la zona horaria del tenant (nunca el reloj UTC del host): un taller en
// GMT-6 a las 23:30 sigue en su dia.
export function todayIn(timeZone: string): string {
  return new Date().toLocaleDateString("en-CA", { timeZone });
}

export function resolvePeriod(
  periodStart: string | undefined,
  periodEnd: string | undefined,
  timeZone: string,
): ResolvedPeriod {
  const todayStr = todayIn(timeZone);
  return {
    start: periodStart ?? `${todayStr.slice(0, 7)}-01`,
    end: periodEnd ?? todayStr,
  };
}

export function dayCount(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / DAY_MS) + 1);
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

// Un sueldo mensual cubre su mes calendario (28-31 dias) y uno quincenal su
// quincena real (1-15 y 16-fin de mes): asi un mes completo da exactamente
// el sueldo pactado, en vez de salario/30*31.
function dailyRate(salary: Decimal, payCycle: ReportPayCycle, day: Date): Decimal {
  if (payCycle === "weekly") return salary.dividedBy(7);
  const monthDays = daysInMonth(day.getUTCFullYear(), day.getUTCMonth());
  if (payCycle === "monthly") return salary.dividedBy(monthDays);
  const fortnightDays = day.getUTCDate() <= 15 ? 15 : monthDays - 15;
  return salary.dividedBy(fortnightDays);
}

export function salaryForPeriod(
  salaryAmount: string,
  payCycle: ReportPayCycle,
  start: string,
  end: string,
): Decimal {
  const salary = new Decimal(salaryAmount);
  const last = new Date(`${end}T00:00:00Z`).getTime();
  let total = new Decimal(0);
  for (let t = new Date(`${start}T00:00:00Z`).getTime(); t <= last; t += DAY_MS) {
    total = total.plus(dailyRate(salary, payCycle, new Date(t)));
  }
  return total;
}
