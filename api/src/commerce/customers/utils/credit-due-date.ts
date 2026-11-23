const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export function resolveCreditDueDate(method: string, dueDate: string | null | undefined, today: string): string | null {
  if (method !== "credito") return null;
  if (!dueDate) throw new Error("Indica la fecha límite de pago del crédito");
  if (!ISO_DAY.test(dueDate) || Number.isNaN(Date.parse(dueDate))) throw new Error("La fecha límite de pago es inválida");
  if (dueDate < today) throw new Error("La fecha límite de pago no puede ser anterior a hoy");
  return dueDate;
}
