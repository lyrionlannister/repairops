// Los reportes de este modulo trabajan con fechas en formato 'YYYY-MM-DD'.
export interface ResolvedPeriod {
  start: string;
  end: string;
}

// "Hoy" en la zona horaria del tenant (nunca el reloj UTC del host): un taller en
// GMT-6 a las 23:30 sigue en su dia.
export function todayIn(timeZone: string): string {
  return new Date().toLocaleDateString("en-CA", { timeZone });
}

export function resolvePeriod(periodStart: string | undefined, periodEnd: string | undefined, timeZone: string): ResolvedPeriod {
  const todayStr = todayIn(timeZone);
  return {
    start: periodStart ?? `${todayStr.slice(0, 7)}-01`,
    end: periodEnd ?? todayStr,
  };
}

export function dayCount(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}
