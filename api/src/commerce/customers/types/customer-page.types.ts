export type CustomerCreditFilter = "pending" | "overdue";

export interface CustomerPageFilters {
  search?: string;
  ids?: string[];
}
