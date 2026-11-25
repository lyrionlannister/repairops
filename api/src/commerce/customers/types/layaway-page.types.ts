import type { Layaway } from "../entities/layaway.entity.js";

export interface LayawayFilters {
  branchId: string | null;
  customerId?: string;
  status?: string;
  search?: string;
}

export type LayawayListRow = Layaway & { customerName: string | null };
