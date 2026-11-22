export interface StagingRow {
  brand: string;
  model: string;
  price: number;
}

export interface StagingRecord {
  importId: string;
  tenantId: string;
  supplierId: string;
  status: StagingStatus;
  rows: StagingRow[];
  error?: string;
  createdAt: string;
}

export type StagingStatus = "processing" | "ready" | "error";
