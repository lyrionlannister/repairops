import type { WhatsappCostByTenant } from "../types/billing-overview";

export interface WhatsappCostTableProps {
  rows: WhatsappCostByTenant[];
  days: number;
}
