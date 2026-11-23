import type { Customer, CustomerCreditFilter, OverdueLevel } from "../types/customers";

export const OVERDUE_ICON_TONE: Record<OverdueLevel, string> = {
  none: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  low: "bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400",
  medium: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  high: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
};

export const OVERDUE_TEXT_TONE: Record<OverdueLevel, string> = {
  none: "text-gray-800 dark:text-white/90",
  low: "text-yellow-600 dark:text-yellow-400",
  medium: "text-orange-600 dark:text-orange-400",
  high: "text-red-600 dark:text-red-400",
};

export const OVERDUE_BADGE_TONE: Record<OverdueLevel, string> = {
  none: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300",
  low: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
  medium: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
  high: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

const hasAmount = (amount: string | undefined): boolean => Number(amount ?? 0) > 0;

export const hasPendingCredit = (customer: Customer): boolean => hasAmount(customer.creditBalance);

export const hasOverdueCredit = (customer: Customer): boolean => hasAmount(customer.overdueBalance);

export const parseCreditFilter = (value: string | null): CustomerCreditFilter =>
  value === "pending" || value === "overdue" ? value : "all";

export const matchesCreditFilter = (customer: Customer, filter: CustomerCreditFilter): boolean => {
  if (filter === "pending") return hasPendingCredit(customer);
  if (filter === "overdue") return hasOverdueCredit(customer);
  return true;
};

export const CREDIT_FILTER_OPTIONS: Array<{ value: CustomerCreditFilter; label: string }> = [
  { value: "all", label: "Todos los clientes" },
  { value: "pending", label: "Con crédito pendiente" },
  { value: "overdue", label: "Con pagos vencidos" },
];
